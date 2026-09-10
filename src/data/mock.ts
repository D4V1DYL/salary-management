import type {
  BackupEntry,
  HutangTransaksi,
  Karyawan,
  PayrollDetail,
  PayrollPeriode,
} from "./types";
import { hitungPayroll, type PayrollInput } from "@/lib/payroll";

/* ------------------------------------------------------------------ *
 *  Seed data — a watch shop payroll (Toko Jam "Arloji Prima").
 *  Mirrors the columns of tes_gajian.xlsm: komisi arloji + reparasi,
 *  uang makan & lembur per-hari, mess, BPJS, kasbon.
 * ------------------------------------------------------------------ */

const KARYAWAN: Karyawan[] = [
  {
    id: 1,
    nik: "AP-2019-001",
    nama: "Bagus Prakoso",
    jabatan: "Kepala Toko",
    divisi: "Manajemen",
    bank: "BCA",
    noRekening: "0182773641",
    namaPenerima: "Bagus Prakoso",
    tanggalMasuk: "2019-02-04",
    aktif: true,
    createdAt: "2019-02-04T02:00:00.000Z",
    komponen: {
      gajiPokok: 6_500_000,
      transportasi: 750_000,
      rateUangMakan: 25_000,
      rateLembur: 45_000,
      bpjs: 187_500,
      bayarMess: 0,
    },
  },
  {
    id: 2,
    nik: "AP-2020-004",
    nama: "Sari Wulandari",
    jabatan: "Supervisor Sales",
    divisi: "Penjualan",
    bank: "BCA",
    noRekening: "0182640551",
    namaPenerima: "Sari Wulandari",
    tanggalMasuk: "2020-06-15",
    aktif: true,
    createdAt: "2020-06-15T02:00:00.000Z",
    komponen: {
      gajiPokok: 4_800_000,
      transportasi: 600_000,
      rateUangMakan: 25_000,
      rateLembur: 35_000,
      bpjs: 144_000,
      bayarMess: 0,
    },
  },
  {
    id: 3,
    nik: "AP-2021-009",
    nama: "Rizky Ramadhan",
    jabatan: "Sales Counter",
    divisi: "Penjualan",
    bank: "BRI",
    noRekening: "338201004417530",
    namaPenerima: "Rizky Ramadhan",
    tanggalMasuk: "2021-03-01",
    aktif: true,
    createdAt: "2021-03-01T02:00:00.000Z",
    komponen: {
      gajiPokok: 3_100_000,
      transportasi: 450_000,
      rateUangMakan: 22_000,
      rateLembur: 28_000,
      bpjs: 93_000,
      bayarMess: 350_000,
    },
  },
  {
    id: 4,
    nik: "AP-2021-011",
    nama: "Dewi Anggraini",
    jabatan: "Sales Counter",
    divisi: "Penjualan",
    bank: "BRI",
    noRekening: "338201004419912",
    namaPenerima: "Dewi Anggraini",
    tanggalMasuk: "2021-09-20",
    aktif: true,
    createdAt: "2021-09-20T02:00:00.000Z",
    komponen: {
      gajiPokok: 3_000_000,
      transportasi: 450_000,
      rateUangMakan: 22_000,
      rateLembur: 28_000,
      bpjs: 90_000,
      bayarMess: 350_000,
    },
  },
  {
    id: 5,
    nik: "AP-2018-002",
    nama: "Hendra Gunawan",
    jabatan: "Teknisi Reparasi Senior",
    divisi: "Servis",
    bank: "BCA",
    noRekening: "0182119284",
    namaPenerima: "Hendra Gunawan",
    tanggalMasuk: "2018-01-08",
    aktif: true,
    createdAt: "2018-01-08T02:00:00.000Z",
    komponen: {
      gajiPokok: 4_200_000,
      transportasi: 500_000,
      rateUangMakan: 25_000,
      rateLembur: 40_000,
      bpjs: 126_000,
      bayarMess: 0,
    },
  },
  {
    id: 6,
    nik: "AP-2022-014",
    nama: "Yoga Pratama",
    jabatan: "Teknisi Reparasi",
    divisi: "Servis",
    bank: "BRI",
    noRekening: "338201004422118",
    namaPenerima: "Yoga Pratama",
    tanggalMasuk: "2022-07-11",
    aktif: true,
    createdAt: "2022-07-11T02:00:00.000Z",
    komponen: {
      gajiPokok: 3_300_000,
      transportasi: 450_000,
      rateUangMakan: 22_000,
      rateLembur: 30_000,
      bpjs: 99_000,
      bayarMess: 350_000,
    },
  },
  {
    id: 7,
    nik: "AP-2020-006",
    nama: "Putri Maharani",
    jabatan: "Kasir",
    divisi: "Keuangan",
    bank: "BCA",
    noRekening: "0182553019",
    namaPenerima: "Putri Maharani",
    tanggalMasuk: "2020-11-02",
    aktif: true,
    createdAt: "2020-11-02T02:00:00.000Z",
    komponen: {
      gajiPokok: 3_400_000,
      transportasi: 450_000,
      rateUangMakan: 22_000,
      rateLembur: 28_000,
      bpjs: 102_000,
      bayarMess: 0,
    },
  },
  {
    id: 8,
    nik: "AP-2019-003",
    nama: "Agus Setiawan",
    jabatan: "Admin & Gudang",
    divisi: "Operasional",
    bank: "BRI",
    noRekening: "338201004415007",
    namaPenerima: "Agus Setiawan",
    tanggalMasuk: "2019-08-19",
    aktif: true,
    createdAt: "2019-08-19T02:00:00.000Z",
    komponen: {
      gajiPokok: 3_200_000,
      transportasi: 450_000,
      rateUangMakan: 22_000,
      rateLembur: 28_000,
      bpjs: 96_000,
      bayarMess: 350_000,
    },
  },
  {
    id: 9,
    nik: "AP-2023-018",
    nama: "Nadia Safitri",
    jabatan: "Sales Counter",
    divisi: "Penjualan",
    bank: "BCA",
    noRekening: "0182889763",
    namaPenerima: "Nadia Safitri",
    tanggalMasuk: "2023-04-03",
    aktif: true,
    createdAt: "2023-04-03T02:00:00.000Z",
    komponen: {
      gajiPokok: 2_900_000,
      transportasi: 400_000,
      rateUangMakan: 22_000,
      rateLembur: 26_000,
      bpjs: 87_000,
      bayarMess: 350_000,
    },
  },
  {
    id: 10,
    nik: "AP-2017-001",
    nama: "Slamet Riyadi",
    jabatan: "Security",
    divisi: "Operasional",
    bank: "BRI",
    noRekening: "338201004410221",
    namaPenerima: "Slamet Riyadi",
    tanggalMasuk: "2017-05-22",
    aktif: true,
    createdAt: "2017-05-22T02:00:00.000Z",
    komponen: {
      gajiPokok: 2_800_000,
      transportasi: 400_000,
      rateUangMakan: 20_000,
      rateLembur: 25_000,
      bpjs: 84_000,
      bayarMess: 300_000,
    },
  },
  {
    id: 11,
    nik: "AP-2021-007",
    nama: "Feri Kurniawan",
    jabatan: "Sales Counter",
    divisi: "Penjualan",
    bank: "BCA",
    noRekening: "0182220147",
    namaPenerima: "Feri Kurniawan",
    tanggalMasuk: "2021-01-18",
    aktif: false,
    createdAt: "2021-01-18T02:00:00.000Z",
    komponen: {
      gajiPokok: 3_000_000,
      transportasi: 450_000,
      rateUangMakan: 22_000,
      rateLembur: 28_000,
      bpjs: 90_000,
      bayarMess: 350_000,
    },
  },
];

const PERIODE: PayrollPeriode[] = [
  {
    id: 1,
    bulan: 7,
    tahun: 2026,
    status: "final",
    createdAt: "2026-07-01T01:00:00.000Z",
    lockedAt: "2026-07-31T09:12:00.000Z",
  },
  {
    id: 2,
    bulan: 8,
    tahun: 2026,
    status: "final",
    createdAt: "2026-08-01T01:00:00.000Z",
    lockedAt: "2026-08-31T08:41:00.000Z",
  },
  {
    id: 3,
    bulan: 9,
    tahun: 2026,
    status: "draft",
    createdAt: "2026-09-01T01:00:00.000Z",
    lockedAt: null,
  },
];

/** Per-periode overrides keyed by karyawan id — everything else falls back to komponen default. */
type Override = Partial<PayrollInput>;
const OVERRIDES: Record<number, Record<number, Override>> = {
  // Juli 2026
  1: {
    1: { hariMakan: 26, hariLembur: 3, insentif: 900_000, bonusDisiplin: 250_000 },
    2: { hariMakan: 25, hariLembur: 5, komisiArloji: 1_450_000, bonusDisiplin: 250_000, potonganHutang: 500_000 },
    3: { hariMakan: 24, hariLembur: 6, komisiArloji: 980_000, komisiReparasi: 0, potonganHutang: 300_000 },
    4: { hariMakan: 26, hariLembur: 2, komisiArloji: 1_120_000, bonusDisiplin: 250_000 },
    5: { hariMakan: 25, hariLembur: 8, komisiReparasi: 1_650_000, bonusDisiplin: 250_000 },
    6: { hariMakan: 24, hariLembur: 6, komisiReparasi: 890_000, potonganHutang: 400_000 },
    7: { hariMakan: 26, hariLembur: 3, bonusDisiplin: 250_000 },
    8: { hariMakan: 25, hariLembur: 4, tambahan: 150_000 },
    9: { hariMakan: 22, hariLembur: 1, komisiArloji: 640_000, potonganHutang: 250_000 },
    10: { hariMakan: 26, hariLembur: 10, bonusDisiplin: 250_000 },
  },
  // Agustus 2026 (THR-free month, higher commissions)
  2: {
    1: { hariMakan: 25, hariLembur: 4, insentif: 950_000, bonusDisiplin: 250_000 },
    2: { hariMakan: 26, hariLembur: 6, komisiArloji: 1_720_000, bonusDisiplin: 250_000, potonganHutang: 500_000 },
    3: { hariMakan: 25, hariLembur: 7, komisiArloji: 1_240_000, potonganHutang: 300_000 },
    4: { hariMakan: 24, hariLembur: 3, komisiArloji: 1_380_000, bonusDisiplin: 250_000 },
    5: { hariMakan: 26, hariLembur: 9, komisiReparasi: 1_910_000, bonusDisiplin: 250_000 },
    6: { hariMakan: 25, hariLembur: 7, komisiReparasi: 1_120_000, potonganHutang: 400_000 },
    7: { hariMakan: 26, hariLembur: 4, bonusDisiplin: 250_000, tambahan: 200_000 },
    8: { hariMakan: 24, hariLembur: 5 },
    9: { hariMakan: 25, hariLembur: 2, komisiArloji: 810_000, potonganHutang: 250_000 },
    10: { hariMakan: 26, hariLembur: 12, bonusDisiplin: 250_000 },
  },
  // September 2026 — DRAFT, partially filled
  3: {
    1: { hariMakan: 18, hariLembur: 2, insentif: 600_000 },
    2: { hariMakan: 17, hariLembur: 3, komisiArloji: 880_000, potonganHutang: 500_000 },
    3: { hariMakan: 16, hariLembur: 4, komisiArloji: 540_000, potonganHutang: 300_000 },
    5: { hariMakan: 17, hariLembur: 5, komisiReparasi: 720_000 },
    7: { hariMakan: 18, hariLembur: 1 },
  },
};

function buildDetails(): PayrollDetail[] {
  const rows: PayrollDetail[] = [];
  for (const periode of PERIODE) {
    const povr = OVERRIDES[periode.id] ?? {};
    const targets = periode.status === "draft" ? Object.keys(povr).map(Number) : KARYAWAN.filter((k) => k.aktif).map((k) => k.id);
    for (const kid of targets) {
      const k = KARYAWAN.find((x) => x.id === kid);
      if (!k) continue;
      const o = povr[kid] ?? {};
      const base: PayrollInput = {
        periodeId: periode.id,
        karyawanId: kid,
        gajiPokok: k.komponen.gajiPokok,
        transportasi: k.komponen.transportasi,
        rateUangMakan: k.komponen.rateUangMakan,
        hariMakan: 0,
        rateLembur: k.komponen.rateLembur,
        hariLembur: 0,
        insentif: 0,
        tambahan: 0,
        bonusDisiplin: 0,
        komisiArloji: 0,
        komisiReparasi: 0,
        thr: 0,
        potonganHutang: 0,
        bpjs: k.komponen.bpjs,
        bayarMess: k.komponen.bayarMess,
        pph21: 0,
        ...o,
      };
      rows.push(hitungPayroll(base));
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ *
 *  Hutang — running balance recomputed by the store, seed is chronological.
 * ------------------------------------------------------------------ */
type HutangSeed = Omit<HutangTransaksi, "id" | "saldoBerjalan" | "createdAt">;

const HUTANG_SEED: HutangSeed[] = [
  { karyawanId: 2, tanggal: "2026-01-15", keterangan: "Kasbon renovasi rumah", kasbon: 3_000_000, pelunasan: 0, periodeId: null },
  { karyawanId: 2, tanggal: "2026-02-28", keterangan: "Potong gaji Februari", kasbon: 0, pelunasan: 500_000, periodeId: null },
  { karyawanId: 2, tanggal: "2026-03-31", keterangan: "Potong gaji Maret", kasbon: 0, pelunasan: 500_000, periodeId: null },
  { karyawanId: 2, tanggal: "2026-04-30", keterangan: "Potong gaji April", kasbon: 0, pelunasan: 500_000, periodeId: null },
  { karyawanId: 2, tanggal: "2026-05-31", keterangan: "Potong gaji Mei", kasbon: 0, pelunasan: 500_000, periodeId: null },
  { karyawanId: 2, tanggal: "2026-06-30", keterangan: "Potong gaji Juni", kasbon: 0, pelunasan: 500_000, periodeId: null },
  { karyawanId: 2, tanggal: "2026-07-31", keterangan: "Potongan payroll Juli 2026", kasbon: 0, pelunasan: 500_000, periodeId: 1 },
  { karyawanId: 2, tanggal: "2026-08-10", keterangan: "Kasbon biaya sekolah anak", kasbon: 2_000_000, pelunasan: 0, periodeId: null },
  { karyawanId: 2, tanggal: "2026-08-31", keterangan: "Potongan payroll Agustus 2026", kasbon: 0, pelunasan: 500_000, periodeId: 2 },

  { karyawanId: 3, tanggal: "2026-02-05", keterangan: "Kasbon DP motor", kasbon: 2_500_000, pelunasan: 0, periodeId: null },
  { karyawanId: 3, tanggal: "2026-03-31", keterangan: "Potong gaji Maret", kasbon: 0, pelunasan: 300_000, periodeId: null },
  { karyawanId: 3, tanggal: "2026-04-30", keterangan: "Potong gaji April", kasbon: 0, pelunasan: 300_000, periodeId: null },
  { karyawanId: 3, tanggal: "2026-05-31", keterangan: "Potong gaji Mei", kasbon: 0, pelunasan: 300_000, periodeId: null },
  { karyawanId: 3, tanggal: "2026-06-30", keterangan: "Potong gaji Juni", kasbon: 0, pelunasan: 300_000, periodeId: null },
  { karyawanId: 3, tanggal: "2026-07-31", keterangan: "Potongan payroll Juli 2026", kasbon: 0, pelunasan: 300_000, periodeId: 1 },
  { karyawanId: 3, tanggal: "2026-08-31", keterangan: "Potongan payroll Agustus 2026", kasbon: 0, pelunasan: 300_000, periodeId: 2 },

  { karyawanId: 6, tanggal: "2026-04-12", keterangan: "Kasbon berobat keluarga", kasbon: 1_800_000, pelunasan: 0, periodeId: null },
  { karyawanId: 6, tanggal: "2026-05-31", keterangan: "Potong gaji Mei", kasbon: 0, pelunasan: 400_000, periodeId: null },
  { karyawanId: 6, tanggal: "2026-06-30", keterangan: "Potong gaji Juni", kasbon: 0, pelunasan: 400_000, periodeId: null },
  { karyawanId: 6, tanggal: "2026-07-31", keterangan: "Potongan payroll Juli 2026", kasbon: 0, pelunasan: 400_000, periodeId: 1 },
  { karyawanId: 6, tanggal: "2026-08-31", keterangan: "Potongan payroll Agustus 2026", kasbon: 0, pelunasan: 400_000, periodeId: 2 },

  { karyawanId: 9, tanggal: "2026-05-20", keterangan: "Kasbon kebutuhan mendesak", kasbon: 1_200_000, pelunasan: 0, periodeId: null },
  { karyawanId: 9, tanggal: "2026-06-30", keterangan: "Potong gaji Juni", kasbon: 0, pelunasan: 250_000, periodeId: null },
  { karyawanId: 9, tanggal: "2026-07-31", keterangan: "Potongan payroll Juli 2026", kasbon: 0, pelunasan: 250_000, periodeId: 1 },
  { karyawanId: 9, tanggal: "2026-08-31", keterangan: "Potongan payroll Agustus 2026", kasbon: 0, pelunasan: 250_000, periodeId: 2 },

  { karyawanId: 8, tanggal: "2026-06-08", keterangan: "Kasbon perbaikan rumah", kasbon: 1_500_000, pelunasan: 0, periodeId: null },
  { karyawanId: 8, tanggal: "2026-07-31", keterangan: "Potong gaji Juli", kasbon: 0, pelunasan: 500_000, periodeId: null },
  { karyawanId: 8, tanggal: "2026-08-31", keterangan: "Potong gaji Agustus", kasbon: 0, pelunasan: 500_000, periodeId: null },
];

const BACKUPS: BackupEntry[] = [
  { id: "bk-20260909-1803", createdAt: "2026-09-09T11:03:00.000Z", trigger: "auto-close", sizeKb: 412, path: "Documents/PayrollApp/backups/payroll-20260909-1803.db.enc" },
  { id: "bk-20260908-1742", createdAt: "2026-09-08T10:42:00.000Z", trigger: "auto-close", sizeKb: 410, path: "Documents/PayrollApp/backups/payroll-20260908-1742.db.enc" },
  { id: "bk-20260905-1631", createdAt: "2026-09-05T09:31:00.000Z", trigger: "manual", sizeKb: 407, path: "Documents/PayrollApp/backups/payroll-20260905-1631.db.enc" },
  { id: "bk-20260831-2015", createdAt: "2026-08-31T13:15:00.000Z", trigger: "auto-close", sizeKb: 398, path: "Documents/PayrollApp/backups/payroll-20260831-2015.db.enc" },
];

export const seed = {
  karyawan: KARYAWAN,
  periode: PERIODE,
  details: buildDetails(),
  hutangSeed: HUTANG_SEED,
  backups: BACKUPS,
};
