import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Wallet,
  Banknote,
  ShieldCheck,
  ArrowRight,
  HandCoins,
  CalendarClock,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/Stat";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/ui/Money";
import { Avatar } from "@/components/ui/Avatar";
import { ColumnChart, MeterRow } from "@/components/ui/charts";
import { usePayroll } from "@/data/store";
import { sumDetails } from "@/lib/payroll";
import { BULAN_SINGKAT, labelPeriode, rupiah, waktuRelatif } from "@/lib/format";

export default function Dashboard() {
  const nav = useNavigate();
  const { karyawan, periode, details, hutang, lastBackupAt, backups } = usePayroll();

  const stats = useMemo(() => {
    const aktif = karyawan.filter((k) => k.aktif);
    const sorted = [...periode].sort((a, b) => a.tahun - b.tahun || a.bulan - b.bulan);
    const lastFinal = [...sorted].reverse().find((p) => p.status === "final");
    const draft = [...sorted].reverse().find((p) => p.status === "draft");

    const perPeriode = sorted.map((p) => {
      const rows = details.filter((d) => d.periodeId === p.id);
      return { p, sum: sumDetails(rows), count: rows.length };
    });

    const lastFinalSum = perPeriode.find((x) => x.p.id === lastFinal?.id)?.sum;
    const prevFinal = [...perPeriode].reverse().filter((x) => x.p.status === "final")[1]?.sum;

    const saldoByKar = aktif
      .map((k) => ({ k, saldo: usePayroll.getState().saldoHutang(k.id) }))
      .filter((x) => x.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo);
    const totalHutang = saldoByKar.reduce((s, x) => s + x.saldo, 0);

    const draftRows = draft ? details.filter((d) => d.periodeId === draft.id) : [];

    return {
      aktif,
      lastFinal,
      draft,
      perPeriode,
      lastFinalSum,
      prevFinal,
      saldoByKar,
      totalHutang,
      draftRows,
      hutangCount: saldoByKar.length,
    };
  }, [karyawan, periode, details, hutang]);

  const growth =
    stats.lastFinalSum && stats.prevFinal && stats.prevFinal.transfer > 0
      ? ((stats.lastFinalSum.transfer - stats.prevFinal.transfer) / stats.prevFinal.transfer) * 100
      : null;

  const chartData = stats.perPeriode.map((x) => ({
    label: `${BULAN_SINGKAT[x.p.bulan - 1]}`,
    value: x.sum.transfer,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan payroll, hutang karyawan, dan status keamanan data untuk toko."
        actions={
          <Button
            icon={<CalendarClock />}
            onClick={() => nav("/input-gaji")}
          >
            Input Gaji {stats.draft ? labelPeriode(stats.draft.bulan, stats.draft.tahun) : "Bulan Ini"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Gaji dibayar · ${stats.lastFinal ? labelPeriode(stats.lastFinal.bulan, stats.lastFinal.tahun) : "—"}`}
          value={<Money value={stats.lastFinalSum?.transfer ?? 0} />}
          icon={<Banknote />}
          accent="brand"
          delta={
            growth != null
              ? { value: `${Math.abs(growth).toFixed(1)}%`, dir: growth >= 0 ? "up" : "down", good: growth >= 0 }
              : undefined
          }
          sub={`${stats.lastFinalSum ? rupiah(stats.lastFinalSum.penerimaan) : "—"} penerimaan · ${
            stats.lastFinalSum ? rupiah(stats.lastFinalSum.potongan) : "—"
          } potongan`}
        />
        <StatCard
          label="Hutang aktif"
          value={<Money value={stats.totalHutang} />}
          icon={<HandCoins />}
          accent="warn"
          sub={`${stats.hutangCount} karyawan punya saldo berjalan`}
        />
        <StatCard
          label="Karyawan aktif"
          value={stats.aktif.length}
          icon={<Users />}
          accent="pos"
          sub={`dari ${karyawan.length} total terdaftar`}
        />
        <StatCard
          label="Backup terakhir"
          value={<span className="text-[16px]">{waktuRelatif(lastBackupAt)}</span>}
          icon={<ShieldCheck />}
          accent="pos"
          sub={`${backups.length} arsip terenkripsi tersimpan`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Total gaji transfer per periode"
            subtitle="Nilai bersih yang ditransfer ke rekening karyawan"
            icon={<Wallet />}
          />
          <CardBody>
            {chartData.length ? (
              <ColumnChart data={chartData} />
            ) : (
              <p className="py-10 text-center text-sm text-muted">Belum ada periode.</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
              {stats.perPeriode.map((x) => (
                <div key={x.p.id}>
                  <p className="text-[11.5px] text-subtle">{labelPeriode(x.p.bulan, x.p.tahun)}</p>
                  <p className="tnum mt-0.5 text-[14px] font-semibold text-text">{rupiah(x.sum.transfer)}</p>
                  <div className="mt-1">
                    <Badge tone={x.p.status === "final" ? "pos" : "warn"} dot>
                      {x.p.status === "final" ? "Final" : "Draft"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Periode berjalan"
            subtitle={stats.draft ? labelPeriode(stats.draft.bulan, stats.draft.tahun) : "—"}
            icon={<CalendarClock />}
          />
          <CardBody className="space-y-4">
            {stats.draft ? (
              <>
                {(() => {
                  const terisi = stats.draftRows.filter((d) => d.hariMakan > 0 || d.hariLembur > 0).length;
                  const denom = Math.max(stats.aktif.length, stats.draftRows.length, 1);
                  return (
                    <div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-muted">Baris terisi</span>
                        <span className="tnum font-semibold text-text">
                          {terisi} / {denom}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-brand transition-[width] duration-500"
                          style={{ width: `${(terisi / denom) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
                <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                  <MeterRow
                    label="Total penerimaan"
                    value={sumDetails(stats.draftRows).penerimaan}
                    total={sumDetails(stats.draftRows).penerimaan}
                    tone="pos"
                    right={rupiah(sumDetails(stats.draftRows).penerimaan)}
                  />
                  <MeterRow
                    label="Total potongan"
                    value={sumDetails(stats.draftRows).potongan}
                    total={sumDetails(stats.draftRows).penerimaan || 1}
                    tone="neg"
                    right={rupiah(sumDetails(stats.draftRows).potongan)}
                  />
                  <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-[13px]">
                    <span className="font-semibold text-text">Estimasi transfer</span>
                    <Money value={sumDetails(stats.draftRows).transfer} strong />
                  </div>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => nav("/input-gaji")}>
                  Lanjutkan input <ArrowRight className="size-4" />
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted">Tidak ada periode draft.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Hutang karyawan tertinggi"
            subtitle="Saldo berjalan per karyawan aktif"
            icon={<HandCoins />}
            actions={
              <Button variant="ghost" size="sm" onClick={() => nav("/rekap-hutang")}>
                Lihat rekap <ArrowRight className="size-3.5" />
              </Button>
            }
          />
          <CardBody className="space-y-1">
            {stats.saldoByKar.slice(0, 5).map(({ k, saldo }) => (
              <div
                key={k.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2/60"
              >
                <Avatar nama={k.nama} id={k.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text">{k.nama}</p>
                  <p className="text-[11.5px] text-subtle">{k.jabatan}</p>
                </div>
                <Money value={saldo} className="text-[13px]" strong />
              </div>
            ))}
            {!stats.saldoByKar.length && (
              <p className="py-6 text-center text-sm text-muted">Tidak ada hutang berjalan. 🎉</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Keamanan data" icon={<ShieldCheck />} />
          <CardBody className="space-y-3 text-[13px]">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-pos" />
              <p className="text-muted">
                Database <span className="font-medium text-text">terenkripsi SQLCipher</span> &amp; terikat
                ke fingerprint perangkat ini.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-pos" />
              <p className="text-muted">
                Auto-backup tiap aplikasi ditutup, retensi 30 arsip terakhir.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-warn" />
              <p className="text-muted">
                Snapshot payroll tidak memakai formula — aman dari <span className="font-mono text-[12px]">#REF!</span>.
              </p>
            </div>
            <Button variant="secondary" className="mt-1 w-full" onClick={() => nav("/backup-lisensi")}>
              Buka Backup &amp; Lisensi
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
