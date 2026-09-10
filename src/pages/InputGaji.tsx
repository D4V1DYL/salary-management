import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  CircleCheckBig,
  Wand2,
  RotateCcw,
  CalendarPlus,
  Info,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ConfirmBody } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { usePayroll } from "@/data/store";
import type { PayrollDetail } from "@/data/types";
import { emptyDetail, sumDetails } from "@/lib/payroll";
import { angka, parseAngka, BULAN, labelPeriode, rupiah } from "@/lib/format";

type Key = keyof PayrollDetail;
interface Col {
  key: Key;
  label: string;
  kind: "edit" | "calc";
  w?: number;
}
interface Group {
  label: string;
  tone: "pos" | "neg";
  cols: Col[];
}

const GROUPS: Group[] = [
  {
    label: "Penerimaan",
    tone: "pos",
    cols: [
      { key: "gajiPokok", label: "Gaji Pokok", kind: "edit", w: 116 },
      { key: "transportasi", label: "Transport", kind: "edit" },
      { key: "rateUangMakan", label: "Rate U.Makan", kind: "edit" },
      { key: "hariMakan", label: "Hari", kind: "edit", w: 64 },
      { key: "totalUangMakan", label: "Total U.Makan", kind: "calc" },
      { key: "rateLembur", label: "Rate Lembur", kind: "edit" },
      { key: "hariLembur", label: "Hari", kind: "edit", w: 64 },
      { key: "totalLembur", label: "Total Lembur", kind: "calc" },
      { key: "insentif", label: "Insentif", kind: "edit" },
      { key: "tambahan", label: "Tambahan", kind: "edit" },
      { key: "bonusDisiplin", label: "Bonus Disiplin", kind: "edit" },
      { key: "komisiArloji", label: "Komisi Arloji", kind: "edit" },
      { key: "komisiReparasi", label: "Komisi Reparasi", kind: "edit" },
      { key: "thr", label: "THR", kind: "edit" },
    ],
  },
  {
    label: "Potongan",
    tone: "neg",
    cols: [
      { key: "potonganHutang", label: "Hutang", kind: "edit" },
      { key: "bpjs", label: "BPJS", kind: "edit" },
      { key: "bayarMess", label: "Bayar Mess", kind: "edit" },
      { key: "pph21", label: "PPh 21", kind: "edit" },
    ],
  },
];
const FLAT = GROUPS.flatMap((g) => g.cols);

export default function InputGaji() {
  const { karyawan, periode, getDetails, ensurePeriode, ensureDetails, updateDetail, resetDetailToDefault, finalizePeriode, unlockPeriode, applyHutangToPeriode, createBackup } =
    usePayroll();

  const [bulan, setBulan] = useState(9);
  const [tahun, setTahun] = useState(2026);
  const [confirmFinal, setConfirmFinal] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);

  const p = periode.find((x) => x.bulan === bulan && x.tahun === tahun);
  const aktif = useMemo(() => karyawan.filter((k) => k.aktif).sort((a, b) => a.nama.localeCompare(b.nama)), [karyawan]);

  const details = usePayroll((s) => s.details);
  const rowsByKar = useMemo(() => {
    if (!p) return new Map<number, PayrollDetail>();
    const m = new Map<number, PayrollDetail>();
    for (const d of details.filter((d) => d.periodeId === p.id)) m.set(d.karyawanId, d);
    return m;
  }, [details, p]);

  const allRows = p ? getDetails(p.id) : [];
  const totals = sumDetails(allRows);
  const locked = p?.status === "final";

  // Every active employee gets a real snapshot row for the viewed periode.
  useEffect(() => {
    if (p) ensureDetails(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id, karyawan.length]);

  const terisi = allRows.filter((r) => r.hariMakan > 0 || r.hariLembur > 0).length;

  function step(delta: number) {
    let b = bulan + delta;
    let y = tahun;
    if (b < 1) {
      b = 12;
      y--;
    }
    if (b > 12) {
      b = 1;
      y++;
    }
    setBulan(b);
    setTahun(y);
  }

  function createPeriode() {
    const created = ensurePeriode(bulan, tahun);
    ensureDetails(created.id);
    toast.success("Periode dibuat", labelPeriode(bulan, tahun));
  }

  const colTotal = (key: Key) => allRows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

  return (
    <>
      <PageHeader
        title="Input Gaji"
        description="Tabel terkontrol seperti spreadsheet — tiap sel divalidasi, total & gaji transfer dihitung otomatis dari rumus asli."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-surface">
              <button
                onClick={() => step(-1)}
                className="grid h-9 w-9 place-items-center rounded-l-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[132px] px-2 text-center text-[13px] font-semibold text-text">
                {BULAN[bulan - 1]} {tahun}
              </span>
              <button
                onClick={() => step(1)}
                className="grid h-9 w-9 place-items-center rounded-r-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        }
      />

      {!p ? (
        <Card>
          <EmptyState
            icon={<CalendarPlus />}
            title={`Belum ada periode ${labelPeriode(bulan, tahun)}`}
            desc="Buat periode untuk mulai input gaji. Komponen gaji default tiap karyawan aktif akan dimuat otomatis sebagai baris awal."
            action={<Button icon={<CalendarPlus />} onClick={createPeriode}>Buat periode {labelPeriode(bulan, tahun)}</Button>}
          />
        </Card>
      ) : (
        <>
          {/* status + actions bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <Badge tone={locked ? "pos" : "warn"} dot>
                {locked ? "Final — terkunci" : "Draft"}
              </Badge>
              <span className="text-[13px] text-muted">
                {terisi} / {allRows.length} baris terisi
              </span>
              {p.lockedAt && (
                <span className="hidden text-[12px] text-subtle sm:inline">
                  dikunci {new Date(p.lockedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!locked && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Wand2 />}
                  onClick={() => {
                    const n = applyHutangToPeriode(p.id);
                    n
                      ? toast.success("Potongan hutang diterapkan", `${n} baris diperbarui (10% dari penerimaan / sisa saldo).`)
                      : toast.info("Tidak ada perubahan", "Semua potongan hutang sudah sesuai.");
                  }}
                >
                  Terapkan potongan hutang
                </Button>
              )}
              {locked ? (
                <Button variant="secondary" size="sm" icon={<LockOpen />} onClick={() => setConfirmUnlock(true)}>
                  Buka kunci
                </Button>
              ) : (
                <Button size="sm" icon={<CircleCheckBig />} onClick={() => setConfirmFinal(true)}>
                  Finalisasi Periode
                </Button>
              )}
            </div>
          </div>

          {/* summary strip */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Total penerimaan" value={rupiah(totals.penerimaan)} tone="pos" />
            <SummaryTile label="Total potongan" value={rupiah(totals.potongan)} tone="neg" />
            <SummaryTile label="Gaji transfer" value={rupiah(totals.transfer)} tone="brand" strong />
            <SummaryTile
              label="Rata-rata / karyawan"
              value={rupiah(allRows.length ? totals.transfer / allRows.length : 0)}
            />
          </div>

          {locked && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-info/30 bg-info-soft px-3.5 py-2.5 text-[12.5px] text-info">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <p>
                Periode ini sudah <strong>final</strong>. Sel tidak bisa diedit sampai kamu membuka kunci secara
                eksplisit — ini melindungi snapshot gaji yang sudah dibayarkan.
              </p>
            </div>
          )}

          <Card inset>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="border-separate border-spacing-0 text-[12.5px]">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-30 min-w-[190px] border-b border-r border-border bg-surface-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-subtle"
                    >
                      Karyawan
                    </th>
                    {GROUPS.map((g) => (
                      <th
                        key={g.label}
                        colSpan={g.cols.length}
                        className={
                          "border-b border-r border-border px-3 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] " +
                          (g.tone === "pos" ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg")
                        }
                      >
                        {g.label}
                      </th>
                    ))}
                    <th
                      colSpan={3}
                      className="border-b border-l-2 border-border border-l-brand bg-brand px-3 py-1.5 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-brand-fg"
                    >
                      Ringkasan
                    </th>
                  </tr>
                  <tr>
                    {FLAT.map((c) => (
                      <th
                        key={c.key}
                        className="border-b border-r border-border bg-surface-2/70 px-2.5 py-2 text-right text-[10.5px] font-semibold uppercase tracking-[0.03em] text-subtle"
                        style={{ minWidth: c.w ?? 100 }}
                      >
                        {c.label}
                      </th>
                    ))}
                    <th className="border-b border-l-2 border-border border-l-brand bg-surface-2/70 px-2.5 py-2 text-right text-[10.5px] font-semibold uppercase text-subtle" style={{ minWidth: 110 }}>
                      Terima
                    </th>
                    <th className="border-b border-r border-border bg-surface-2/70 px-2.5 py-2 text-right text-[10.5px] font-semibold uppercase text-subtle" style={{ minWidth: 110 }}>
                      Potong
                    </th>
                    <th className="sticky right-0 z-20 border-b border-l border-border bg-brand px-2.5 py-2 text-right text-[10.5px] font-semibold uppercase text-brand-fg" style={{ minWidth: 132 }}>
                      Transfer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {aktif.map((k) => {
                    const d: PayrollDetail = rowsByKar.get(k.id) ?? emptyDetail(p.id, k.id);

                    return (
                      <tr key={k.id} className="group">
                        <td className="sticky left-0 z-20 border-b border-r border-border bg-surface px-3 py-1.5 group-hover:bg-surface-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar nama={k.nama} id={k.id} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-medium text-text">{k.nama}</p>
                              <p className="truncate text-[10.5px] text-subtle">{k.jabatan}</p>
                            </div>
                            {!locked && (
                              <button
                                onClick={() => {
                                  resetDetailToDefault(p.id, k.id);
                                  toast.info("Baris direset", `${k.nama} kembali ke komponen default.`);
                                }}
                                className="opacity-0 transition-opacity group-hover:opacity-100"
                                title="Reset ke komponen default"
                              >
                                <RotateCcw className="size-3.5 text-subtle hover:text-text" />
                              </button>
                            )}
                          </div>
                        </td>

                        {FLAT.map((c) => {
                          const val = Number(d[c.key]) || 0;
                          if (c.kind === "calc") {
                            return (
                              <td
                                key={c.key}
                                className="border-b border-r border-border bg-surface-2/40 px-2.5 py-1.5 text-right tnum text-subtle"
                              >
                                {val ? angka(val) : "—"}
                              </td>
                            );
                          }
                          return (
                            <td key={c.key} className="border-b border-r border-border px-0 py-0">
                              <input
                                disabled={locked}
                                value={val ? angka(val) : ""}
                                placeholder="0"
                                inputMode="numeric"
                                onChange={(e) => updateDetail(p.id, k.id, { [c.key]: parseAngka(e.target.value) })}
                                className="h-9 w-full bg-transparent px-2.5 text-right tnum text-text outline-none transition-colors placeholder:text-border-strong focus:bg-brand/8 focus:ring-2 focus:ring-inset focus:ring-brand disabled:text-subtle"
                              />
                            </td>
                          );
                        })}

                        <td className="border-b border-l-2 border-border border-l-brand/40 bg-surface px-2.5 py-1.5 text-right tnum font-medium text-pos group-hover:bg-surface-2">
                          {angka(d.totalPenerimaan)}
                        </td>
                        <td className="border-b border-r border-border bg-surface px-2.5 py-1.5 text-right tnum font-medium text-neg group-hover:bg-surface-2">
                          {angka(d.totalPotongan)}
                        </td>
                        <td className="sticky right-0 z-10 border-b border-l border-border bg-navy-50 px-2.5 py-1.5 text-right tnum font-semibold text-brand shadow-[-10px_0_14px_-10px_rgba(9,23,37,0.25)] dark:bg-navy-900">
                          {angka(d.gajiTransfer)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="sticky left-0 z-20 border-t-2 border-r border-border bg-surface-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
                      Total ({allRows.length})
                    </td>
                    {FLAT.map((c) => (
                      <td
                        key={c.key}
                        className="border-t-2 border-r border-border bg-surface-2 px-2.5 py-2.5 text-right tnum text-[11.5px] font-semibold text-muted"
                      >
                        {colTotal(c.key) ? angka(colTotal(c.key)) : "—"}
                      </td>
                    ))}
                    <td className="border-t-2 border-l-2 border-border border-l-brand bg-surface-2 px-2.5 py-2.5 text-right tnum text-[11.5px] font-bold text-pos">
                      {angka(totals.penerimaan)}
                    </td>
                    <td className="border-t-2 border-r border-border bg-surface-2 px-2.5 py-2.5 text-right tnum text-[11.5px] font-bold text-neg">
                      {angka(totals.potongan)}
                    </td>
                    <td className="sticky right-0 z-10 border-t-2 border-l border-border bg-brand px-2.5 py-2.5 text-right tnum text-[11.5px] font-bold text-brand-fg shadow-[-8px_0_12px_-8px_rgba(9,23,37,0.18)]">
                      {angka(totals.transfer)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-subtle">
            <Info className="size-3.5" />
            Perubahan tersimpan otomatis ke database terenkripsi. Kolom abu-abu dihitung dari rumus dan tidak bisa diedit.
          </p>
        </>
      )}

      <Modal
        open={confirmFinal}
        onClose={() => setConfirmFinal(false)}
        title="Finalisasi periode?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmFinal(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (p) {
                  finalizePeriode(p.id);
                  createBackup("auto-close");
                  toast.success("Periode difinalisasi", `${labelPeriode(bulan, tahun)} terkunci & dibackup.`);
                }
                setConfirmFinal(false);
              }}
            >
              Ya, finalisasi
            </Button>
          </>
        }
      >
        <ConfirmBody>
          Setelah final, seluruh sel <strong>{labelPeriode(bulan, tahun)}</strong> terkunci dari edit dan
          sistem membuat backup terenkripsi. Kamu tetap bisa membuka kunci nanti bila perlu koreksi.
        </ConfirmBody>
      </Modal>

      <Modal
        open={confirmUnlock}
        onClose={() => setConfirmUnlock(false)}
        title="Buka kunci periode final?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmUnlock(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (p) {
                  unlockPeriode(p.id);
                  toast.warn("Periode dibuka", `${labelPeriode(bulan, tahun)} kembali berstatus draft.`);
                }
                setConfirmUnlock(false);
              }}
            >
              Buka kunci
            </Button>
          </>
        }
      >
        <ConfirmBody>
          Periode <strong>{labelPeriode(bulan, tahun)}</strong> akan kembali ke status draft dan bisa diedit.
          Lakukan hanya untuk koreksi yang memang diperlukan.
        </ConfirmBody>
      </Modal>
    </>
  );
}

function SummaryTile({
  label,
  value,
  tone = "text",
  strong,
}: {
  label: string;
  value: string;
  tone?: "text" | "pos" | "neg" | "brand";
  strong?: boolean;
}) {
  const c =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "brand" ? "text-brand" : "text-text";
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="text-[11.5px] font-medium text-subtle">{label}</p>
      <p className={`tnum mt-1 ${strong ? "text-[17px] font-bold" : "text-[15px] font-semibold"} ${c}`}>{value}</p>
    </div>
  );
}
