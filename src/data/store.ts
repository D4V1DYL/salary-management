import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  BackupEntry,
  HutangTransaksi,
  Karyawan,
  KomponenDefault,
  PayrollDetail,
  PayrollPeriode,
} from "./types";
import { emptyDetail, hitungPayroll, type PayrollInput } from "@/lib/payroll";
import { inElectron } from "@/lib/electron";
import { seed } from "./mock";

const STORAGE_KEY = "dmtech.payroll.db";

function nextId(rows: { id: number }[]): number {
  return rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

/** Recompute every running balance for one karyawan, chronologically. */
function recalcSaldo(all: HutangTransaksi[], karyawanId: number): HutangTransaksi[] {
  const mine = all
    .filter((h) => h.karyawanId === karyawanId)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id - b.id);
  let saldo = 0;
  const patched = new Map<number, number>();
  for (const h of mine) {
    saldo += h.kasbon - h.pelunasan;
    patched.set(h.id, saldo);
  }
  return all.map((h) => (patched.has(h.id) ? { ...h, saldoBerjalan: patched.get(h.id)! } : h));
}

function buildHutangFromSeed(): HutangTransaksi[] {
  let id = 1;
  const rows: HutangTransaksi[] = seed.hutangSeed.map((s) => ({
    ...s,
    id: id++,
    saldoBerjalan: 0,
    createdAt: new Date(s.tanggal + "T03:00:00.000Z").toISOString(),
  }));
  const ids = [...new Set(rows.map((r) => r.karyawanId))];
  return ids.reduce((acc, kid) => recalcSaldo(acc, kid), rows);
}

interface PayrollState {
  karyawan: Karyawan[];
  periode: PayrollPeriode[];
  details: PayrollDetail[];
  hutang: HutangTransaksi[];
  backups: BackupEntry[];
  lastBackupAt: string;

  /* ---- karyawan ---- */
  addKaryawan: (data: Omit<Karyawan, "id" | "createdAt">) => Karyawan;
  updateKaryawan: (id: number, patch: Partial<Karyawan>) => void;
  setKaryawanAktif: (id: number, aktif: boolean) => void;
  removeKaryawan: (id: number) => { ok: boolean; reason?: string };

  /* ---- periode ---- */
  ensurePeriode: (bulan: number, tahun: number) => PayrollPeriode;
  getPeriode: (bulan: number, tahun: number) => PayrollPeriode | undefined;
  finalizePeriode: (periodeId: number) => void;
  unlockPeriode: (periodeId: number) => void;

  /* ---- payroll detail ---- */
  ensureDetails: (periodeId: number) => void;
  getDetails: (periodeId: number) => PayrollDetail[];
  updateDetail: (periodeId: number, karyawanId: number, patch: Partial<PayrollInput>) => void;
  resetDetailToDefault: (periodeId: number, karyawanId: number) => void;
  applyHutangToPeriode: (periodeId: number) => number;

  /* ---- hutang ---- */
  addHutang: (data: Omit<HutangTransaksi, "id" | "saldoBerjalan" | "createdAt">) => void;
  removeHutang: (id: number) => void;
  saldoHutang: (karyawanId: number) => number;

  /* ---- backup / misc ---- */
  createBackup: (trigger: BackupEntry["trigger"]) => BackupEntry;
  /** Load a backup file's raw contents back into the store. Returns false if the file is invalid. */
  importSnapshot: (raw: string) => boolean;
  resetAll: () => void;
}

const initial = () => ({
  karyawan: seed.karyawan,
  periode: seed.periode,
  details: seed.details,
  hutang: buildHutangFromSeed(),
  backups: seed.backups,
  lastBackupAt: seed.backups[0]?.createdAt ?? new Date().toISOString(),
});

function komponenToInput(k: KomponenDefault, periodeId: number, karyawanId: number): PayrollInput {
  return {
    ...emptyDetail(periodeId, karyawanId),
    gajiPokok: k.gajiPokok,
    transportasi: k.transportasi,
    rateUangMakan: k.rateUangMakan,
    rateLembur: k.rateLembur,
    bpjs: k.bpjs,
    bayarMess: k.bayarMess,
  };
}

export const usePayroll = create<PayrollState>()(
  persist(
    (set, get) => ({
      ...initial(),

      addKaryawan: (data) => {
        const row: Karyawan = { ...data, id: nextId(get().karyawan), createdAt: new Date().toISOString() };
        set((s) => ({ karyawan: [...s.karyawan, row] }));
        return row;
      },

      updateKaryawan: (id, patch) =>
        set((s) => ({
          karyawan: s.karyawan.map((k) => (k.id === id ? { ...k, ...patch, komponen: { ...k.komponen, ...(patch.komponen ?? {}) } } : k)),
        })),

      setKaryawanAktif: (id, aktif) =>
        set((s) => ({ karyawan: s.karyawan.map((k) => (k.id === id ? { ...k, aktif } : k)) })),

      removeKaryawan: (id) => {
        const usedInPayroll = get().details.some((d) => d.karyawanId === id);
        const usedInHutang = get().hutang.some((h) => h.karyawanId === id);
        if (usedInPayroll || usedInHutang) {
          return { ok: false, reason: "Karyawan sudah punya riwayat gaji / hutang. Nonaktifkan saja agar data historis tetap utuh." };
        }
        set((s) => ({ karyawan: s.karyawan.filter((k) => k.id !== id) }));
        return { ok: true };
      },

      ensurePeriode: (bulan, tahun) => {
        const found = get().periode.find((p) => p.bulan === bulan && p.tahun === tahun);
        if (found) return found;
        const row: PayrollPeriode = {
          id: nextId(get().periode),
          bulan,
          tahun,
          status: "draft",
          createdAt: new Date().toISOString(),
          lockedAt: null,
        };
        set((s) => ({ periode: [...s.periode, row] }));
        get().ensureDetails(row.id);
        return row;
      },

      getPeriode: (bulan, tahun) => get().periode.find((p) => p.bulan === bulan && p.tahun === tahun),

      finalizePeriode: (periodeId) =>
        set((s) => ({
          periode: s.periode.map((p) =>
            p.id === periodeId ? { ...p, status: "final", lockedAt: new Date().toISOString() } : p
          ),
        })),

      unlockPeriode: (periodeId) =>
        set((s) => ({
          periode: s.periode.map((p) => (p.id === periodeId ? { ...p, status: "draft", lockedAt: null } : p)),
        })),

      ensureDetails: (periodeId) => {
        const { karyawan, details } = get();
        const have = new Set(details.filter((d) => d.periodeId === periodeId).map((d) => d.karyawanId));
        const add = karyawan
          .filter((k) => k.aktif && !have.has(k.id))
          .map((k) => hitungPayroll(komponenToInput(k.komponen, periodeId, k.id)));
        if (add.length) set((s) => ({ details: [...s.details, ...add] }));
      },

      getDetails: (periodeId) => get().details.filter((d) => d.periodeId === periodeId),

      updateDetail: (periodeId, karyawanId, patch) =>
        set((s) => {
          let touched = false;
          const details = s.details.map((d) => {
            if (d.periodeId !== periodeId || d.karyawanId !== karyawanId) return d;
            touched = true;
            return hitungPayroll({ ...d, ...patch });
          });
          if (!touched) {
            const k = s.karyawan.find((x) => x.id === karyawanId);
            if (k) {
              details.push(hitungPayroll({ ...komponenToInput(k.komponen, periodeId, karyawanId), ...patch }));
            }
          }
          return { details };
        }),

      resetDetailToDefault: (periodeId, karyawanId) =>
        set((s) => {
          const k = s.karyawan.find((x) => x.id === karyawanId);
          if (!k) return s;
          return {
            details: s.details.map((d) =>
              d.periodeId === periodeId && d.karyawanId === karyawanId
                ? hitungPayroll(komponenToInput(k.komponen, periodeId, karyawanId))
                : d
            ),
          };
        }),

      applyHutangToPeriode: (periodeId) => {
        const { details, hutang } = get();
        let count = 0;
        const rows = details
          .filter((d) => d.periodeId === periodeId)
          .map((d) => {
            const saldo = hutang
              .filter((h) => h.karyawanId === d.karyawanId)
              .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id - b.id)
              .reduce((acc, h) => acc + h.kasbon - h.pelunasan, 0);
            if (saldo <= 0) return d;
            const cicilan = Math.min(saldo, Math.max(0, Math.round(d.totalPenerimaan * 0.1)));
            if (cicilan === d.potonganHutang) return d;
            count++;
            return hitungPayroll({ ...d, potonganHutang: cicilan });
          });
        set((s) => ({
          details: s.details.map((d) => {
            const hit = rows.find((r) => r.periodeId === d.periodeId && r.karyawanId === d.karyawanId);
            return hit ?? d;
          }),
        }));
        return count;
      },

      addHutang: (data) =>
        set((s) => {
          const row: HutangTransaksi = {
            ...data,
            id: nextId(s.hutang),
            saldoBerjalan: 0,
            createdAt: new Date().toISOString(),
          };
          return { hutang: recalcSaldo([...s.hutang, row], data.karyawanId) };
        }),

      removeHutang: (id) =>
        set((s) => {
          const target = s.hutang.find((h) => h.id === id);
          if (!target) return s;
          return { hutang: recalcSaldo(s.hutang.filter((h) => h.id !== id), target.karyawanId) };
        }),

      saldoHutang: (karyawanId) => {
        const mine = get()
          .hutang.filter((h) => h.karyawanId === karyawanId)
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id - b.id);
        return mine.length ? mine[mine.length - 1].saldoBerjalan : 0;
      },

      createBackup: (trigger) => {
        const now = new Date();
        const stamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, "").slice(0, 12);
        const entry: BackupEntry = {
          id: `bk-${stamp}`,
          createdAt: now.toISOString(),
          trigger,
          sizeKb: 380 + Math.round(Math.random() * 80),
          path: `Documents/PayrollApp/backups/payroll-${stamp}.json`,
        };
        set((s) => ({ backups: [entry, ...s.backups].slice(0, 30), lastBackupAt: entry.createdAt }));

        // Fire-and-forget: when running as the real desktop app, actually
        // write the file and reconcile this entry with the real path/size.
        if (inElectron()) {
          const snapshot = localStorage.getItem(STORAGE_KEY);
          if (snapshot) {
            window
              .electronAPI!.writeBackup(snapshot, trigger)
              .then((real) => {
                set((s) => ({
                  backups: s.backups.map((b) =>
                    b.id === entry.id ? { ...b, path: real.path, sizeKb: real.sizeKb } : b
                  ),
                }));
              })
              .catch(() => {
                /* best-effort — the UI-tracked entry above still stands */
              });
          }
        }

        return entry;
      },

      importSnapshot: (raw) => {
        try {
          const parsed = JSON.parse(raw);
          const s = parsed?.state ?? parsed;
          if (!s || !Array.isArray(s.karyawan) || !Array.isArray(s.details)) return false;
          set({
            karyawan: s.karyawan,
            periode: Array.isArray(s.periode) ? s.periode : [],
            details: s.details,
            hutang: Array.isArray(s.hutang) ? s.hutang : [],
            backups: Array.isArray(s.backups) ? s.backups : get().backups,
            lastBackupAt: s.lastBackupAt ?? new Date().toISOString(),
          });
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () => set({ ...initial() }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        karyawan: s.karyawan,
        periode: s.periode,
        details: s.details,
        hutang: s.hutang,
        backups: s.backups,
        lastBackupAt: s.lastBackupAt,
      }),
    }
  )
);
