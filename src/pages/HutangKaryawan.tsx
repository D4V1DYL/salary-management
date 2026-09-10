import { useEffect, useMemo, useState } from "react";
import { Plus, Search, HandCoins, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/misc";
import { Modal, ConfirmBody } from "@/components/ui/Modal";
import { TextField, TextArea, NumberField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { toast } from "@/components/ui/toast";
import { usePayroll } from "@/data/store";
import { rupiah, tanggalPendek } from "@/lib/format";

export default function HutangKaryawan() {
  const { karyawan, hutang, addHutang, removeHutang, saldoHutang } = usePayroll();
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: "kasbon" as "kasbon" | "pelunasan",
    jumlah: 0,
    keterangan: "",
  });

  const people = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return karyawan
      .filter((k) => k.aktif || saldoHutang(k.id) !== 0)
      .map((k) => ({ k, saldo: saldoHutang(k.id) }))
      .filter((x) => !needle || x.k.nama.toLowerCase().includes(needle) || x.k.nik.toLowerCase().includes(needle))
      .sort((a, b) => b.saldo - a.saldo || a.k.nama.localeCompare(b.k.nama));
  }, [karyawan, hutang, q, saldoHutang]);

  useEffect(() => {
    if (!people.length) setSelId(null);
    else if (!people.some((p) => p.k.id === selId)) setSelId(people[0].k.id);
  }, [people, selId]);

  const sel = karyawan.find((k) => k.id === selId);
  const mutasi = useMemo(
    () =>
      hutang
        .filter((h) => h.karyawanId === selId)
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id - b.id),
    [hutang, selId]
  );
  const totalKasbon = mutasi.reduce((s, m) => s + m.kasbon, 0);
  const totalPelunasan = mutasi.reduce((s, m) => s + m.pelunasan, 0);
  const saldoAkhir = mutasi.length ? mutasi[mutasi.length - 1].saldoBerjalan : 0;

  function submit() {
    if (!sel) return;
    if (form.jumlah <= 0) {
      toast.error("Jumlah tidak valid", "Masukkan nominal lebih dari 0.");
      return;
    }
    addHutang({
      karyawanId: sel.id,
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim() || (form.jenis === "kasbon" ? "Kasbon" : "Pelunasan"),
      kasbon: form.jenis === "kasbon" ? form.jumlah : 0,
      pelunasan: form.jenis === "pelunasan" ? form.jumlah : 0,
      periodeId: null,
    });
    toast.success("Transaksi dicatat", `${form.jenis === "kasbon" ? "Kasbon" : "Pelunasan"} ${rupiah(form.jumlah)} · ${sel.nama}`);
    setForm((f) => ({ ...f, jumlah: 0, keterangan: "" }));
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Hutang Karyawan"
        description="Mutasi kasbon & pelunasan per karyawan. Saldo berjalan dihitung otomatis oleh sistem — tidak akan pernah #REF! lagi."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <Card inset className="h-fit">
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
          <div className="scrollbar-thin max-h-[600px] overflow-y-auto p-1.5">
            {people.map(({ k, saldo }) => (
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
                  <p className="text-[11px] text-subtle">{k.jabatan}</p>
                </div>
                <span
                  className={
                    "tnum shrink-0 text-[11.5px] font-semibold " + (saldo > 0 ? "text-warn" : "text-subtle")
                  }
                >
                  {saldo > 0 ? rupiah(saldo) : "—"}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div className="min-w-0">
          {sel ? (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-3">
                    <Avatar nama={sel.nama} id={sel.id} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-text">{sel.nama}</p>
                      <p className="text-[12px] text-subtle">{sel.jabatan}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                  <p className="text-[11.5px] font-medium text-subtle">Saldo hutang berjalan</p>
                  <p className="tnum mt-1 text-[20px] font-bold text-warn">{rupiah(saldoAkhir)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                  <p className="text-[11.5px] font-medium text-subtle">Kasbon / Pelunasan</p>
                  <p className="tnum mt-1 text-[13px] font-semibold text-text">
                    <span className="text-neg">{rupiah(totalKasbon)}</span>
                    <span className="mx-1.5 text-border-strong">/</span>
                    <span className="text-pos">{rupiah(totalPelunasan)}</span>
                  </p>
                </div>
              </div>

              <Card inset>
                <CardHeader
                  title="Riwayat mutasi"
                  subtitle={`${mutasi.length} transaksi`}
                  icon={<HandCoins />}
                  actions={
                    <Button size="sm" icon={<Plus />} onClick={() => setOpen(true)}>
                      Tambah Transaksi
                    </Button>
                  }
                />
                {mutasi.length ? (
                  <Table minWidth={640}>
                    <thead>
                      <tr>
                        <Th>Tanggal</Th>
                        <Th>Keterangan</Th>
                        <Th align="right">Kasbon</Th>
                        <Th align="right">Pelunasan</Th>
                        <Th align="right">Saldo berjalan</Th>
                        <Th align="right"></Th>
                      </tr>
                    </thead>
                    <tbody>
                      {mutasi.map((m) => (
                        <Tr key={m.id}>
                          <Td className="whitespace-nowrap text-muted">{tanggalPendek(m.tanggal)}</Td>
                          <Td>
                            <span className="text-text">{m.keterangan}</span>
                            {m.periodeId && (
                              <Badge tone="info" className="ml-2">
                                payroll
                              </Badge>
                            )}
                          </Td>
                          <Td align="right">
                            {m.kasbon ? <span className="text-neg">{rupiah(m.kasbon)}</span> : <span className="text-subtle">—</span>}
                          </Td>
                          <Td align="right">
                            {m.pelunasan ? <span className="text-pos">{rupiah(m.pelunasan)}</span> : <span className="text-subtle">—</span>}
                          </Td>
                          <Td align="right" className="font-semibold text-text">
                            {rupiah(m.saldoBerjalan)}
                          </Td>
                          <Td align="right">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Hapus"
                              onClick={() => setDelId(m.id)}
                            >
                              <Trash2 className="size-3.5 text-subtle hover:text-neg" />
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="border-t-2 border-border bg-surface-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
                          Saldo akhir
                        </td>
                        <td className="border-t-2 border-border bg-surface-2 px-3 py-2.5 text-right tnum text-[12px] font-semibold text-neg">
                          {rupiah(totalKasbon)}
                        </td>
                        <td className="border-t-2 border-border bg-surface-2 px-3 py-2.5 text-right tnum text-[12px] font-semibold text-pos">
                          {rupiah(totalPelunasan)}
                        </td>
                        <td className="border-t-2 border-border bg-surface-2 px-3 py-2.5 text-right tnum text-[13px] font-bold text-text">
                          {rupiah(saldoAkhir)}
                        </td>
                        <td className="border-t-2 border-border bg-surface-2" />
                      </tr>
                    </tfoot>
                  </Table>
                ) : (
                  <EmptyState
                    icon={<HandCoins />}
                    title="Belum ada transaksi hutang"
                    desc={`${sel.nama} belum punya catatan kasbon atau pelunasan.`}
                    action={
                      <Button icon={<Plus />} onClick={() => setOpen(true)}>
                        Tambah transaksi pertama
                      </Button>
                    }
                  />
                )}
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState icon={<HandCoins />} title="Pilih karyawan" desc="Pilih karyawan di panel kiri untuk melihat riwayat hutangnya." />
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Transaksi Hutang"
        description={sel ? `Untuk ${sel.nama}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Segmented
            value={form.jenis}
            onChange={(jenis) => setForm((f) => ({ ...f, jenis }))}
            options={[
              { value: "kasbon", label: "Kasbon (+)", icon: <ArrowDownLeft /> },
              { value: "pelunasan", label: "Pelunasan (−)", icon: <ArrowUpRight /> },
            ]}
            className="w-full [&>button]:flex-1"
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
            <NumberField
              label="Jumlah"
              value={form.jumlah}
              onValue={(jumlah) => setForm((f) => ({ ...f, jumlah }))}
            />
          </div>
          <TextArea
            label="Keterangan"
            value={form.keterangan}
            onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
            placeholder="mis. Kasbon biaya sekolah anak"
          />
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-[12px] text-muted">
            Saldo berjalan akan dihitung ulang otomatis secara kronologis setelah transaksi disimpan.
          </p>
        </div>
      </Modal>

      <Modal
        open={delId != null}
        onClose={() => setDelId(null)}
        title="Hapus transaksi?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelId(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (delId != null) {
                  removeHutang(delId);
                  toast.warn("Transaksi dihapus", "Saldo berjalan telah dihitung ulang.");
                }
                setDelId(null);
              }}
            >
              Hapus
            </Button>
          </>
        }
      >
        <ConfirmBody>
          Transaksi akan dihapus permanen dan seluruh saldo berjalan karyawan ini dihitung ulang.
        </ConfirmBody>
      </Modal>
    </>
  );
}
