/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VENDOR_NAME?: string;
  readonly VITE_VENDOR_INITIALS?: string;
  readonly VITE_LOGO_SRC?: string;
  readonly VITE_PRODUCT_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_VENDOR_URL?: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_COMPANY_LEGAL_NAME?: string;
  readonly VITE_COMPANY_INITIALS?: string;
  readonly VITE_COMPANY_ADDRESS?: string;
  readonly VITE_COMPANY_NPWP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
