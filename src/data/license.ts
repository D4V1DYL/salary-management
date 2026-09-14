import { create } from "zustand";
import { inElectron, type FingerprintInfo, type LicenseStatus } from "@/lib/electron";
import { getDeviceFingerprint as mockFingerprint } from "@/lib/device";

/**
 * Shared license state. In the real desktop app it reflects the Electron
 * main process (trial countdown / full / expired / copied-to-other-machine).
 * In a plain web preview (`npm run dev`) it reports a permanent full license
 * so the design workflow is never gated.
 */

function mockFingerprintInfo(): FingerprintInfo {
  const m = mockFingerprint();
  return { hash: m.hash, short: m.short, machineGuid: m.machineGuid, hostname: m.hostname };
}

function mockStatus(): LicenseStatus {
  return {
    plan: "full",
    state: "full",
    daysLeft: 0,
    trialDays: 14,
    fingerprint: mockFingerprintInfo(),
    activatedAt: mockFingerprint().boundAt,
  };
}

interface LicenseStore {
  status: LicenseStatus | null;
  loading: boolean;
  refresh: () => Promise<LicenseStatus>;
  activate: (key: string) => Promise<LicenseStatus>;
}

export const useLicense = create<LicenseStore>((set) => ({
  status: null,
  loading: true,

  refresh: async () => {
    const status = inElectron() ? await window.electronAPI!.licenseStatus() : mockStatus();
    set({ status, loading: false });
    return status;
  },

  activate: async (key: string) => {
    if (!inElectron()) {
      const status = mockStatus();
      set({ status, loading: false });
      return status;
    }
    const status = await window.electronAPI!.activateLicenseKey(key);
    set({ status, loading: false });
    return status;
  },
}));
