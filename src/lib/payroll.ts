import type { PayrollDetail } from "@/data/types";

/**
 * Business logic ported verbatim from `tes_gajian.xlsm` › sheet `DataKaryawan`:
 *
 *   Total Uang Makan = rate_uang_makan × hari_makan
 *   Total Lembur     = rate_lembur × hari_lembur
 *   Total Penerimaan = Gaji Pokok + Transport + Total Uang Makan + Total Lembur
 *                    + Insentif + Tambahan + Bonus Disiplin
 *                    + Komisi Arloji + Komisi Reparasi + THR
 *   Total Potongan   = Hutang + BPJS + Bayar Mess + PPh21
 *   Gaji Transfer    = Total Penerimaan − Total Potongan
 *
 * In Excel these were cell formulas that broke (#REF!/#N/A) whenever a row was
 * inserted. Here they are one pure function, validated on every edit.
 */
export type PayrollInput = Omit<
  PayrollDetail,
  | "totalUangMakan"
  | "totalLembur"
  | "totalPenerimaan"
  | "totalPotongan"
  | "gajiTransfer"
>;

export const EARNING_FIELDS = [
  "gajiPokok",
  "transportasi",
  "totalUangMakan",
  "totalLembur",
  "insentif",
  "tambahan",
  "bonusDisiplin",
  "komisiArloji",
  "komisiReparasi",
  "thr",
] as const;

export const DEDUCTION_FIELDS = ["potonganHutang", "bpjs", "bayarMess", "pph21"] as const;

function n(v: number | null | undefined): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? Math.round(x) : 0;
}

export function hitungPayroll(input: PayrollInput): PayrollDetail {
  const totalUangMakan = n(input.rateUangMakan) * n(input.hariMakan);
  const totalLembur = n(input.rateLembur) * n(input.hariLembur);

  const totalPenerimaan =
    n(input.gajiPokok) +
    n(input.transportasi) +
    totalUangMakan +
    totalLembur +
    n(input.insentif) +
    n(input.tambahan) +
    n(input.bonusDisiplin) +
    n(input.komisiArloji) +
    n(input.komisiReparasi) +
    n(input.thr);

  const totalPotongan =
    n(input.potonganHutang) + n(input.bpjs) + n(input.bayarMess) + n(input.pph21);

  return {
    ...input,
    totalUangMakan,
    totalLembur,
    totalPenerimaan,
    totalPotongan,
    gajiTransfer: totalPenerimaan - totalPotongan,
  };
}

export function emptyDetail(periodeId: number, karyawanId: number): PayrollDetail {
  return hitungPayroll({
    periodeId,
    karyawanId,
    gajiPokok: 0,
    transportasi: 0,
    rateUangMakan: 0,
    hariMakan: 0,
    rateLembur: 0,
    hariLembur: 0,
    insentif: 0,
    tambahan: 0,
    bonusDisiplin: 0,
    komisiArloji: 0,
    komisiReparasi: 0,
    thr: 0,
    potonganHutang: 0,
    bpjs: 0,
    bayarMess: 0,
    pph21: 0,
  });
}

export function sumDetails(rows: PayrollDetail[]) {
  return rows.reduce(
    (acc, r) => {
      acc.penerimaan += r.totalPenerimaan;
      acc.potongan += r.totalPotongan;
      acc.transfer += r.gajiTransfer;
      acc.hutang += r.potonganHutang;
      acc.lembur += r.totalLembur;
      acc.uangMakan += r.totalUangMakan;
      return acc;
    },
    { penerimaan: 0, potongan: 0, transfer: 0, hutang: 0, lembur: 0, uangMakan: 0 }
  );
}
