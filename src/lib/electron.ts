/**
 * Single source of truth for the `window.electronAPI` bridge shape
 * (exposed by electron/preload.cjs) and the one place that knows whether
 * we're actually running inside the desktop shell vs. a plain web preview.
 */
export interface FingerprintInfo {
  hash: string;
  short: string;
  machineGuid: string;
  hostname: string;
}

export type LicenseState = "trial" | "trial-expired" | "full" | "invalid";

export interface LicenseStatus {
  plan: "trial" | "full";
  state: LicenseState;
  daysLeft: number;
  trialDays: number;
  fingerprint: FingerprintInfo;
  activatedAt: string | null;
}

export interface BackupFileInfo {
  id: string;
  createdAt: string;
  trigger: string;
  sizeKb: number;
  path: string;
}

export interface ElectronBridge {
  deviceFingerprint: () => Promise<FingerprintInfo>;
  licenseStatus: () => Promise<LicenseStatus>;
  activateLicenseKey: (key: string) => Promise<LicenseStatus>;

  dbLoad: () => Promise<string | null>;
  dbSave: (json: string) => Promise<boolean>;
  dbClear: () => Promise<boolean>;

  writeBackup: (json: string, trigger: string) => Promise<BackupFileInfo>;
  listBackups: () => Promise<BackupFileInfo[]>;
  openBackupFolder: () => Promise<void>;
  pickRestoreBackup: () => Promise<{ path: string; content: string } | null>;

  saveTextFile: (defaultName: string, content: string) => Promise<string | null>;
  savePdf: (defaultName: string) => Promise<string | null>;

  /** Fires once, right before the window closes, so we can flush a final backup. */
  onRequestCloseData: (handler: () => void) => void;
  sendCloseData: (json: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridge;
  }
}

export function inElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

/** True when the app is usable right now (full license, or trial still running). */
export function isUsable(s: LicenseStatus | null): boolean {
  if (!s) return true; // optimistic while loading / web preview
  return s.state === "full" || s.state === "trial";
}
