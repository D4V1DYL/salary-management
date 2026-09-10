/**
 * Branding & tenant config — everything client-specific in one place.
 *
 * Override per deployment via a `.env` file (see `.env.example`). Vite only
 * exposes vars prefixed with `VITE_`, read at dev/build start.
 *
 *   VITE_COMPANY_NAME="CV Sumber Rejeki"
 *   VITE_COMPANY_INITIALS="SR"
 *   ...
 *
 * Nothing else in the app hard-codes a company or vendor name — change it
 * here (or in `.env`) and it propagates to the sidebar, lock screen,
 * slip gaji, and the About panel.
 */
const env = import.meta.env;

function pick(value: string | undefined, fallback: string): string {
  const v = (value ?? "").trim();
  return v.length ? v : fallback;
}

export const brand = {
  /** The software vendor (DM Tech) — its trademark stays on every build. */
  vendor: {
    name: pick(env.VITE_VENDOR_NAME, "DM Tech"),
    /** Monogram used by the drawn fallback logo when no image file is present. */
    initials: pick(env.VITE_VENDOR_INITIALS, "DM"),
    /**
     * Real logo file. Drop it in `public/` and point here (default
     * `/brand-logo.png`). Also accepts `.svg`. If the file is missing the
     * app falls back to a drawn gold-ring + serif-monogram badge.
     */
    logoSrc: pick(env.VITE_LOGO_SRC, "/brand-logo.png"),
    product: pick(env.VITE_PRODUCT_NAME, "Payroll Suite"),
    version: pick(env.VITE_APP_VERSION, "0.1.0"),
    website: pick(env.VITE_VENDOR_URL, "dm.tech"),
  },

  /** The client / tenant — the business that runs payroll here. */
  company: {
    /** Display name (title case) — sidebar, About, lock screen. */
    name: pick(env.VITE_COMPANY_NAME, "Toko Jam Arloji Prima"),
    /** Legal name (as printed on the slip header). */
    legalName: pick(env.VITE_COMPANY_LEGAL_NAME, "TOKO JAM ARLOJI PRIMA"),
    /** 1–3 letters for the slip letterhead tile. */
    initials: pick(env.VITE_COMPANY_INITIALS, "AP"),
    address: pick(env.VITE_COMPANY_ADDRESS, "Jl. Pasar Baru No. 27, Jakarta Pusat"),
    npwp: pick(env.VITE_COMPANY_NPWP, "09.254.117.3-021.000"),
  },
} as const;

/** "DM Tech Payroll" — vendor name + the word Payroll, used in chrome/titles. */
export const appTitle = `${brand.vendor.name} Payroll`;
