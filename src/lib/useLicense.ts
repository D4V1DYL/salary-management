import { invoke } from "@tauri-apps/api/core";
import { getDeviceFingerprint as mockFingerprint, rebindDevice as mockRebind } from "./device";

/**
 * Real device-lock, backed by Rust (src-tauri/src/lib.rs):
 *   SHA-256(Windows MachineGuid | hostname | compiled-in salt)
 * bound to a marker file in the app's data dir on first run.
 *
 * When running as a plain web preview (`npm run dev`, no Tauri host),
 * everything here falls back to the cosmetic mock in `./device` so the
 * design/preview workflow keeps working unchanged.
 */

export interface FingerprintInfo {
  hash: string;
  short: string;
  machineGuid: string;
  hostname: string;
}

export interface LicenseStatus {
  fingerprint: FingerprintInfo;
  /** Has this install ever been activated on any machine? */
  bound: boolean;
  /** Does the CURRENT machine match the bound fingerprint? */
  matches: boolean;
  boundAt: string | null;
}

export function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function mockStatus(): LicenseStatus {
  const m = mockFingerprint();
  return {
    fingerprint: { hash: m.hash, short: m.short, machineGuid: m.machineGuid, hostname: m.hostname },
    bound: true,
    matches: true,
    boundAt: m.boundAt,
  };
}

export async function fetchLicenseStatus(): Promise<LicenseStatus> {
  if (!inTauri()) return mockStatus();
  return invoke<LicenseStatus>("check_license");
}

/** First-run self-binding. No-op if this install is already bound. */
export async function activateLicense(): Promise<LicenseStatus> {
  if (!inTauri()) return mockStatus();
  return invoke<LicenseStatus>("activate_license");
}

/** Admin re-bind to the current machine — requires the transfer password. */
export async function transferLicense(password: string): Promise<LicenseStatus> {
  if (!inTauri()) {
    mockRebind();
    return mockStatus();
  }
  return invoke<LicenseStatus>("transfer_license", { password });
}
