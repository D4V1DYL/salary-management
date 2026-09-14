use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

/// Compiled-in pepper so the fingerprint can't be reproduced from
/// machine GUID + hostname alone without this binary. Not a strong
/// secret (anyone who decompiles the exe can read it) — it raises the
/// bar for casual copying, it does not stop a determined attacker.
const APP_SALT: &str = "dmtech-payroll::device-lock::v1";

/// Password required to re-bind an already-licensed install to a new
/// machine (hardware replacement, legitimate migration). Change this
/// before shipping to a client.
const TRANSFER_PASSWORD: &str = "dmtech-admin-2026";

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct FingerprintInfo {
    hash: String,
    short: String,
    machine_guid: String,
    hostname: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct LicenseMarker {
    fingerprint: String,
    bound_at: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct LicenseStatus {
    fingerprint: FingerprintInfo,
    /// Has this install ever been activated on any machine?
    bound: bool,
    /// Does the CURRENT machine's fingerprint match the bound one?
    matches: bool,
    bound_at: Option<String>,
}

#[cfg(windows)]
fn machine_guid() -> String {
    use winreg::enums::HKEY_LOCAL_MACHINE;
    use winreg::RegKey;
    RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey("SOFTWARE\\Microsoft\\Cryptography")
        .and_then(|key| key.get_value::<String, _>("MachineGuid"))
        .unwrap_or_else(|_| "unknown-machine".to_string())
}

#[cfg(not(windows))]
fn machine_guid() -> String {
    "unknown-machine".to_string()
}

fn hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "unknown-host".to_string())
}

fn now_epoch_ms() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

/// SHA-256(machine_guid | hostname | salt) — stable across normal use,
/// changes if the app + its data are copied to different hardware.
fn compute_fingerprint() -> FingerprintInfo {
    let guid = machine_guid();
    let host = hostname();
    let raw = format!("{guid}|{host}|{APP_SALT}");

    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    let digest = hasher.finalize();
    let hash: String = digest.iter().map(|b| format!("{b:02x}")).collect();

    let short = hash[..24]
        .as_bytes()
        .chunks(4)
        .map(|c| std::str::from_utf8(c).unwrap_or("").to_uppercase())
        .collect::<Vec<_>>()
        .join(" ");

    FingerprintInfo {
        hash,
        short,
        machine_guid: guid,
        hostname: host,
    }
}

fn license_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("license.lock"))
}

fn read_marker(app: &tauri::AppHandle) -> Result<Option<LicenseMarker>, String> {
    let path = license_path(app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw)
        .map(Some)
        .map_err(|e| e.to_string())
}

fn write_marker(app: &tauri::AppHandle, fingerprint: &str) -> Result<LicenseMarker, String> {
    let marker = LicenseMarker {
        fingerprint: fingerprint.to_string(),
        bound_at: now_epoch_ms(),
    };
    let path = license_path(app)?;
    let json = serde_json::to_string_pretty(&marker).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(marker)
}

fn status_from(fp: FingerprintInfo, marker: Option<LicenseMarker>) -> LicenseStatus {
    match marker {
        Some(m) => LicenseStatus {
            matches: m.fingerprint == fp.hash,
            bound: true,
            bound_at: Some(m.bound_at),
            fingerprint: fp,
        },
        None => LicenseStatus {
            matches: false,
            bound: false,
            bound_at: None,
            fingerprint: fp,
        },
    }
}

#[tauri::command]
fn device_fingerprint() -> FingerprintInfo {
    compute_fingerprint()
}

/// Read-only: is this install bound, and does it match this machine?
#[tauri::command]
fn check_license(app: tauri::AppHandle) -> Result<LicenseStatus, String> {
    let fp = compute_fingerprint();
    let marker = read_marker(&app)?;
    Ok(status_from(fp, marker))
}

/// First-run self-binding: if never activated, bind to this machine now.
/// If already bound, this is a no-op (does NOT silently re-bind a
/// mismatched install — that requires `transfer_license`).
#[tauri::command]
fn activate_license(app: tauri::AppHandle) -> Result<LicenseStatus, String> {
    let fp = compute_fingerprint();
    match read_marker(&app)? {
        Some(marker) => Ok(status_from(fp, Some(marker))),
        None => {
            let marker = write_marker(&app, &fp.hash)?;
            Ok(status_from(fp, Some(marker)))
        }
    }
}

/// Admin-only: re-bind this install to the current machine (hardware
/// replacement / legitimate migration). Requires the transfer password.
#[tauri::command]
fn transfer_license(app: tauri::AppHandle, password: String) -> Result<LicenseStatus, String> {
    if password != TRANSFER_PASSWORD {
        return Err("Password transfer salah.".to_string());
    }
    let fp = compute_fingerprint();
    let marker = write_marker(&app, &fp.hash)?;
    Ok(status_from(fp, Some(marker)))
}

/// Blank/white WebView2 windows on VMs and some remote-desktop/RDP sessions
/// are almost always a failed GPU compositor (no real GPU passthrough).
/// Forcing WebView2's Chromium to render in software fixes it, and costs
/// nothing on machines with a real GPU — this app has no need for GPU
/// acceleration anyway.
#[cfg(windows)]
fn disable_webview_gpu() {
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--disable-gpu --disable-gpu-compositing",
    );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(windows)]
    disable_webview_gpu();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            device_fingerprint,
            check_license,
            activate_license,
            transfer_license
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
