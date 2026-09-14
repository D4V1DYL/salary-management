import { useMemo, useState } from "react";
import { ClipboardList, Download, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, SectionLabel } from "@/components/ui/misc";
import { MeterRow } from "@/components/ui/charts";
import { toast } from "@/components/ui/toast";
import { usePayroll } from "@/data/store";
import { inElectron } from "@/lib/electron";
import { rupiah } from "@/lib/format";

/** Wrap a CSV field: quote if it contains a comma, quote or newline. */
function csv(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function RekapHutang() {
  const { karyawan, hutang } = usePayroll();

  const years = useMemo(() => {
    const ys = new Set<number>();
    hutang.forEach((h) => ys.add(Number(h.tanggal.slice(0, 4))));
    ys.add(new Date().getFullYear());
    return [...ys].sort((a, b) => b - a);
  }, [hutang]);

  const [tahun, setTahun] = useState(years[0] ?? 2026);

  const rows = useMemo(() => {
    const start = `${tahun}-01-01`;
    const end = `${tahun}-12-31`;
    return karyawan
      .map((k) => {
        const mine = hutang
          .filter((h) => h.karyawanId === k.id)
          .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id - b.id);
        const saldoAwal = mine
          .filter((h) => h.tanggal < start)
          .reduce((s, h) => s + h.kasbon - h.pelunasan, 0);
        const inRange = mine.filter((h) => h.tanggal >= start && h.tanggal <= end);
        const debit = inRange.reduce((s, h) => s + h.kasbon, 0);
        const kredit = inRange.reduce((s, h) => s + h.pelunasan, 0);
        const saldoAkhir = saldoAwal + debit - kredit;
        return { k, saldoAwal, debit, kredit, saldoAkhir, count: inRange.length };
      })
      .filter((r) => r.saldoAwal !== 0 || r.debit !== 0 || r.kredit !== 0)
      .sort((a, b) => b.saldoAkhir - a.saldoAkhir);
  }, [karyawan, hutang, tahun]);

  const tot = rows.reduce(
    (s, r) => ({
      saldoAwal: s.saldoAwal + r.saldoAwal,
      debit: s.debit + r.debit,
      kredit: s.kredit + r.kredit,
      saldoAkhir: s.saldoAkhir + r.saldoAkhir,
    }),
    { saldoAwal: 0, debit: 0, kredit: 0, saldoAkhir: 0 }
  );

  return (
    <>
      <PageHeader
        title="Rekap Hutang"
        description="Ringkasan saldo awal, debit (kasbon), kredit (pelunasan) dan saldo akhir seluruh karyawan per tahun."
        actions={
          <div className="flex items-center gap-2">
            <Segmented
              value={String(tahun)}
              onChange={(v) => setTahun(Number(v))}
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
            <Button
              variant="secondary"
              icon={<Download />}
              disabled={!rows.length}
              onClick={async () => {
                const header = ["NIK", "Nama", "Jabatan", "Saldo Awal", "Debit (Kasbon)", "Kredit (Pelunasan)", "Saldo Akhir"];
                const body = rows.map((r) =>
                  [r.k.nik, r.k.nama, r.k.jabatan, r.saldoAwal, r.debit, r.kredit, r.saldoAkhir].map(csv).join(",")
                );
                const totalRow = ["", "TOTAL", "", tot.saldoAwal, tot.debit, tot.kredit, tot.saldoAkhir].map(csv).join(",");
                const content = [header.map(csv).join(","), ...body, totalRow].join("\r\n");
                const fileName = `rekap-hutang-${tahun}.csv`;

                if (inElectron()) {
                  const saved = await window.electronAPI!.saveTextFile(fileName, content);
                  if (saved) toast.success("Rekap diekspor", saved.split(/[\\/]/).pop());
                } else {
                  // Web preview: trigger a browser download.
                  const url = URL.createObjectURL(new Blob(["﻿" + content], { type: "text/csv" }));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Rekap diekspor", fileName);
                }
              }}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Saldo awal tahun" value={rupiah(tot.saldoAwal)} />
        <Tile label="Debit (kasbon)" value={rupiah(tot.debit)} tone="neg" />
        <Tile label="Kredit (pelunasan)" value={rupiah(tot.kredit)} tone="pos" />
        <Tile label="Saldo akhir" value={rupiah(tot.saldoAkhir)} tone="warn" strong />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card inset>
          <CardHeader title={`Rekap ${tahun}`} subtitle={`${rows.length} karyawan dengan aktivitas hutang`} icon={<ClipboardList />} />
          {rows.length ? (
            <Table minWidth={720}>
              <thead>
                <tr>
                  <Th>Karyawan</Th>
                  <Th align="right">Saldo Awal</Th>
                  <Th align="right">Debit</Th>
                  <Th align="right">Kredit</Th>
                  <Th align="right">Saldo Akhir</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Tr key={r.k.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar nama={r.k.nama} id={r.k.id} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text">{r.k.nama}</p>
                          <p className="text-[11px] text-subtle">
                            {r.k.jabatan} · {r.count} transaksi
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td align="right" className="text-muted">
                      {rupiah(r.saldoAwal)}
                    </Td>
                    <Td align="right">
                      {r.debit ? <span className="text-neg">{rupiah(r.debit)}</span> : <span className="text-subtle">—</span>}
                    </Td>
                    <Td align="right">
                      {r.kredit ? <span className="text-pos">{rupiah(r.kredit)}</span> : <span className="text-subtle">—</span>}
                    </Td>
                    <Td align="right" className="font-semibold text-text">
                      {r.saldoAkhir > 0 ? (
                        <span className="text-warn">{rupiah(r.saldoAkhir)}</span>
                      ) : (
                        rupiah(r.saldoAkhir)
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border-t-2 border-border bg-surface-2 px-3 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
                    Total
                  </td>
                  <td className="border-t-2 border-border bg-surface-2 px-3 py-3 text-right tnum text-[12px] font-semibold text-muted">
                    {rupiah(tot.saldoAwal)}
                  </td>
                  <td className="border-t-2 border-border bg-surface-2 px-3 py-3 text-right tnum text-[12px] font-semibold text-neg">
                    {rupiah(tot.debit)}
                  </td>
                  <td className="border-t-2 border-border bg-surface-2 px-3 py-3 text-right tnum text-[12px] font-semibold text-pos">
                    {rupiah(tot.kredit)}
                  </td>
                  <td className="border-t-2 border-border bg-surface-2 px-3 py-3 text-right tnum text-[13px] font-bold text-warn">
                    {rupiah(tot.saldoAkhir)}
                  </td>
                </tr>
              </tfoot>
            </Table>
          ) : (
            <EmptyState icon={<ClipboardList />} title={`Tidak ada aktivitas hutang di ${tahun}`} desc="Coba pilih tahun lain." />
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Komposisi saldo akhir" />
            <CardBody>
              {rows.filter((r) => r.saldoAkhir > 0).length ? (
                rows
                  .filter((r) => r.saldoAkhir > 0)
                  .slice(0, 6)
                  .map((r) => (
                    <MeterRow
                      key={r.k.id}
                      label={r.k.nama}
                      value={r.saldoAkhir}
                      total={tot.saldoAkhir || 1}
                      tone="warn"
                      right={rupiah(r.saldoAkhir)}
                    />
                  ))
              ) : (
                <p className="py-6 text-center text-sm text-muted">Tidak ada saldo hutang tersisa.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <SectionLabel className="mb-2 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> Integritas data
              </SectionLabel>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Di file Excel lama, sheet <span className="font-mono text-[11.5px]">REKAP HUTANG</span> sebagian
                sudah <span className="font-mono text-[11.5px] text-neg">#REF!</span> karena baris tersisip. Di
                sini setiap angka dihitung ulang dari transaksi mentah tiap kali dibuka — tidak ada formula
                yang bisa patah.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Tile({
  label,
  value,
  tone = "text",
  strong,
}: {
  label: string;
  value: string;
  tone?: "text" | "pos" | "neg" | "warn";
  strong?: boolean;
}) {
  const c = tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "warn" ? "text-warn" : "text-text";
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="text-[11.5px] font-medium text-subtle">{label}</p>
      <p className={`tnum mt-1 ${strong ? "text-[18px] font-bold" : "text-[15px] font-semibold"} ${c}`}>{value}</p>
    </div>
  );
}
