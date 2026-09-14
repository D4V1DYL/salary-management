import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Printer, FileStack, Search, ReceiptText } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/misc";
import { SlipSheet } from "@/components/slip/SlipSheet";
import { toast } from "@/components/ui/toast";
import { usePayroll } from "@/data/store";
import { inElectron } from "@/lib/electron";
import { BULAN, labelPeriode, rupiah } from "@/lib/format";

/**
 * Export slips to PDF. In the desktop app this renders a real PDF file the
 * user picks a location for (via Electron's printToPDF). In the web preview
 * it falls back to the browser's print dialog ("Save as PDF").
 */
async function exportPDF(mode: "one" | "all", fileName: string, label: string) {
  document.body.dataset.print = mode;

  if (inElectron()) {
    // Let the print CSS apply, then render to PDF.
    await new Promise((r) => setTimeout(r, 80));
    try {
      const saved = await window.electronAPI!.savePdf(fileName);
      if (saved) toast.success("PDF tersimpan", saved.split(/[\\/]/).pop());
    } catch {
      toast.error("Gagal membuat PDF", "Coba lagi.");
    } finally {
      delete document.body.dataset.print;
    }
    return;
  }

  // Web preview fallback.
  const done = () => {
    delete document.body.dataset.print;
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  setTimeout(() => {
    window.print();
    toast.info("Dialog cetak dibuka", `Pilih "Save as PDF" untuk menyimpan ${label}.`);
  }, 60);
}

export default function SlipGaji() {
  const { karyawan, periode, details } = usePayroll();
  const [bulan, setBulan] = useState(8);
  const [tahun, setTahun] = useState(2026);
  const [selId, setSelId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  const p = periode.find((x) => x.bulan === bulan && x.tahun === tahun);
  const rows = useMemo(() => (p ? details.filter((d) => d.periodeId === p.id) : []), [details, p]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .map((d) => ({ d, k: karyawan.find((k) => k.id === d.karyawanId)! }))
      .filter((x) => x.k)
      .filter((x) => !needle || x.k.nama.toLowerCase().includes(needle) || x.k.nik.toLowerCase().includes(needle))
      .sort((a, b) => a.k.nama.localeCompare(b.k.nama));
  }, [rows, karyawan, q]);

  useEffect(() => {
    if (!list.length) {
      setSelId(null);
    } else if (!list.some((x) => x.k.id === selId)) {
      setSelId(list[0].k.id);
    }
  }, [list, selId]);

  const selected = list.find((x) => x.k.id === selId);

  function step(delta: number) {
    let b = bulan + delta;
    let y = tahun;
    if (b < 1) (b = 12), y--;
    if (b > 12) (b = 1), y++;
    setBulan(b);
    setTahun(y);
  }

  return (
    <>
      <PageHeader
        title="Slip Gaji"
        description="Pratinjau & ekspor slip gaji per karyawan ke PDF. Layout mengikuti format cetak toko."
        actions={
          <div className="flex items-center rounded-lg border border-border bg-surface">
            <button
              onClick={() => step(-1)}
              className="grid h-9 w-9 place-items-center rounded-l-lg text-muted hover:bg-surface-2 hover:text-text"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[132px] px-2 text-center text-[13px] font-semibold text-text">
              {BULAN[bulan - 1]} {tahun}
            </span>
            <button
              onClick={() => step(1)}
              className="grid h-9 w-9 place-items-center rounded-r-lg text-muted hover:bg-surface-2 hover:text-text"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />

      {!p || !rows.length ? (
        <Card>
          <EmptyState
            icon={<ReceiptText />}
            title={`Belum ada data gaji ${labelPeriode(bulan, tahun)}`}
            desc="Isi dan simpan periode ini di menu Input Gaji terlebih dahulu untuk membuat slip."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          {/* left: employee list */}
          <Card inset className="no-print h-fit">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari karyawan…"
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] text-text placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
              </div>
            </div>
            <div className="scrollbar-thin max-h-[560px] overflow-y-auto p-1.5">
              {list.map(({ k, d }) => (
                <button
                  key={k.id}
                  onClick={() => setSelId(k.id)}
                  className={
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors " +
                    (k.id === selId ? "bg-brand-tint ring-1 ring-inset ring-brand/20" : "hover:bg-surface-2")
                  }
                >
                  <Avatar nama={k.nama} id={k.id} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-text">{k.nama}</p>
                    <p className="tnum text-[11px] text-subtle">{rupiah(d.gajiTransfer)}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-border p-3">
              <Button
                variant="secondary"
                className="w-full"
                icon={<FileStack />}
                onClick={() =>
                  exportPDF(
                    "all",
                    `slip-gaji-${BULAN[bulan - 1]}-${tahun}.pdf`,
                    `${list.length} slip ${labelPeriode(bulan, tahun)}`
                  )
                }
              >
                Export semua ({list.length}) — 1 PDF
              </Button>
            </div>
          </Card>

          {/* right: preview */}
          <div className="min-w-0">
            <div className="no-print mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge tone={p.status === "final" ? "pos" : "warn"} dot>
                  {p.status === "final" ? "Final" : "Draft"}
                </Badge>
                {selected && (
                  <span className="text-[13px] text-muted">
                    {selected.k.nama} · {selected.k.jabatan}
                  </span>
                )}
              </div>
              <Button
                icon={<Printer />}
                disabled={!selected}
                onClick={() =>
                  selected &&
                  exportPDF(
                    "one",
                    `slip-${selected.k.nama.replace(/\s+/g, "-")}-${BULAN[bulan - 1]}-${tahun}.pdf`,
                    `slip ${selected.k.nama}`
                  )
                }
              >
                Export PDF
              </Button>
            </div>

            <div className="scrollbar-thin overflow-x-auto rounded-xl bg-surface-2/60 p-4 ring-1 ring-border">
              {selected && (
                <div className="slip-one">
                  <SlipSheet karyawan={selected.k} detail={selected.d} periode={p} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* hidden print-all container */}
      {p && (
        <div className="slip-all pointer-events-none fixed left-[-9999px] top-0" aria-hidden>
          {list.map(({ k, d }) => (
            <SlipSheet key={k.id} karyawan={k} detail={d} periode={p} />
          ))}
        </div>
      )}
    </>
  );
}
