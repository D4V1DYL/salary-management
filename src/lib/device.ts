/**
 * MOCK device-lock fingerprint.
 *
 * In the real Tauri build this is computed in Rust from:
 *   Volume Serial Number + Windows Machine GUID + hostname  ->  SHA-256
 * and folded into the SQLCipher key as  Argon2(fingerprint + app_secret).
 *
 * Here we fake a stable value so the UI (Backup & Lisensi, lock screen) is
 * real to look at. Nothing is encrypted in the frontend prototype.
 */
const STORE_KEY = "dmtech.payroll.device";

export interface DeviceFingerprint {
  hash: string; // full SHA-256 hex (mock)
  short: string; // grouped, human display
  volumeSerial: string;
  machineGuid: string;
  hostname: string;
  boundAt: string;
}

function hex(len: number): string {
  const c = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * 16)];
  return s;
}

function group(hash: string): string {
  return (hash.slice(0, 24).match(/.{1,4}/g) ?? []).join(" ").toUpperCase();
}

export function getDeviceFingerprint(): DeviceFingerprint {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as DeviceFingerprint;
  } catch {
    /* ignore */
  }
  const hash = hex(64);
  const fp: DeviceFingerprint = {
    hash,
    short: group(hash),
    volumeSerial: `${hex(4)}-${hex(4)}`.toUpperCase(),
    machineGuid: `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`.toUpperCase(),
    hostname: "DMTECH-PAYROLL-01",
    boundAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(fp));
  } catch {
    /* ignore */
  }
  return fp;
}

export function rebindDevice(): DeviceFingerprint {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
  return getDeviceFingerprint();
}
