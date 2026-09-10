export interface Karyawan {
  id: number;
  nik: string;
  nama: string;
  jabatan: string;
  divisi: string;
  noRekening: string;
  namaPenerima: string;
  bank: string;
  tanggalMasuk: string; // ISO date
  aktif: boolean;
  createdAt: string;
  /** Default salary components — become the starting values each new periode. */
  komponen: KomponenDefault;
}

export interface KomponenDefault {
  gajiPokok: number;
  transportasi: number;
  rateUangMakan: number; // per hari
  rateLembur: number; // per hari
  bpjs: number;
  bayarMess: number;
}

export type StatusPeriode = "draft" | "final";

export interface PayrollPeriode {
  id: number;
  bulan: number; // 1-12
  tahun: number;
  status: StatusPeriode;
  createdAt: string;
  lockedAt: string | null;
}

/**
 * SNAPSHOT — one row per karyawan per periode. Every value is stored,
 * never re-derived from a live formula. This is the "anti #REF!" core.
 */
export interface PayrollDetail {
  periodeId: number;
  karyawanId: number;

  // Penerimaan (earnings)
  gajiPokok: number;
  transportasi: number;
  rateUangMakan: number;
  hariMakan: number;
  totalUangMakan: number;
  rateLembur: number;
  hariLembur: number;
  totalLembur: number;
  insentif: number;
  tambahan: number;
  bonusDisiplin: number;
  komisiArloji: number;
  komisiReparasi: number;
  thr: number;

  // Potongan (deductions)
  potonganHutang: number;
  bpjs: number;
  bayarMess: number;
  pph21: number;

  // Derived totals (persisted)
  totalPenerimaan: number;
  totalPotongan: number;
  gajiTransfer: number;
}

export interface HutangTransaksi {
  id: number;
  karyawanId: number;
  tanggal: string; // ISO date
  keterangan: string;
  kasbon: number; // debit — adds to saldo
  pelunasan: number; // credit — reduces saldo
  saldoBerjalan: number; // computed by the store on insert, never by hand
  periodeId: number | null; // set when a payroll deduction created it
  createdAt: string;
}

export interface BackupEntry {
  id: string;
  createdAt: string;
  trigger: "manual" | "auto-close" | "transfer-lisensi";
  sizeKb: number;
  path: string;
}
