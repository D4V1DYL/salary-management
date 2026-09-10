import { useMemo, useState } from "react";
import {
  UserPlus,
  Search,
  Pencil,
  Building2,
  CircleUserRound,
  Ban,
  CircleCheck,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { EmptyState, SectionLabel } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, NumberField } from "@/components/ui/Field";
import { toast } from "@/components/ui/toast";
import { usePayroll } from "@/data/store";
import type { Karyawan } from "@/data/types";
import { rupiah } from "@/lib/format";

const DIVISI = ["Manajemen", "Penjualan", "Servis", "Keuangan", "Operasional"];
const BANKS = ["BCA", "BRI", "BNI", "Mandiri", "BSI", "CIMB Niaga"];

type Draft = Omit<Karyawan, "id" | "createdAt">;

const emptyDraft = (): Draft => ({
  nik: "",
  nama: "",
  jabatan: "",
  divisi: "Penjualan",
  bank: "BCA",
  noRekening: "",
  namaPenerima: "",
  tanggalMasuk: new Date().toISOString().slice(0, 10),
  aktif: true,
  komponen: {
    gajiPokok: 0,
    transportasi: 0,
    rateUangMakan: 0,
    rateLembur: 0,
    bpjs: 0,
    bayarMess: 0,
  },
});

export default function DataKaryawan() {
  const { karyawan, addKaryawan, updateKaryawan, setKaryawanAktif } = usePayroll();
  const [q, setQ] = useState("");
  const [divisi, setDivisi] = useState("semua");
  const [showInactive, setShowInactive] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...karyawan]
      .filter((k) => (showInactive ? true : k.aktif))
      .filter((k) => (divisi === "semua" ? true : k.divisi === divisi))
      .filter(
        (k) =>
          !needle ||
          k.nama.toLowerCase().includes(needle) ||
          k.nik.toLowerCase().includes(needle) ||
          k.jabatan.toLowerCase().includes(needle)
      )
      .sort((a, b) => Number(b.aktif) - Number(a.aktif) || a.nama.localeCompare(b.nama));
  }, [karyawan, q, divisi, showInactive]);

  const totalGajiPokok = karyawan.filter((k) => k.aktif).reduce((s, k) => s + k.komponen.gajiPokok, 0);

  function openCreate() {
    setEditId(null);
    setDraft(emptyDraft());
    setOpen(true);
  }
  function openEdit(k: Karyawan) {
    setEditId(k.id);
    const { id: _id, createdAt: _c, ...rest } = k;
    void _id;
    void _c;
    setDraft(structuredClone(rest));
    setOpen(true);
  }

  function save() {
    if (!draft.nama.trim() || !draft.nik.trim()) {
      toast.error("Lengkapi data", "Nama dan NIK wajib diisi.");
      return;
    }
    const dup = karyawan.some(
      (k) => k.nik.toLowerCase() === draft.nik.trim().toLowerCase() && k.id !== editId
    );
    if (dup) {
      toast.error("NIK sudah dipakai", `NIK ${draft.nik} milik karyawan lain.`);
      return;
    }
    const payload: Draft = {
      ...draft,
      nama: draft.nama.trim(),
      nik: draft.nik.trim(),
      namaPenerima: draft.namaPenerima.trim() || draft.nama.trim(),
    };
    if (editId == null) {
      addKaryawan(payload);
      toast.success("Karyawan ditambahkan", payload.nama);
    } else {
      updateKaryawan(editId, payload);
      toast.success("Perubahan disimpan", payload.nama);
    }
    setOpen(false);
  }

  const setK = <K extends keyof Draft["komponen"]>(key: K, v: number) =>
    setDraft((d) => ({ ...d, komponen: { ...d.komponen, [key]: v } }));

  return (
    <>
      <PageHeader
        title="Data Karyawan"
        description="Master data karyawan beserta komponen gaji default yang jadi nilai awal tiap periode."
        actions={
          <Button icon={<UserPlus />} onClick={openCreate}>
            Tambah Karyawan
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Total karyawan" value={String(karyawan.length)} />
        <MiniStat label="Aktif" value={String(karyawan.filter((k) => k.aktif).length)} tone="pos" />
        <MiniStat
          label="Nonaktif"
          value={String(karyawan.filter((k) => !k.aktif).length)}
          tone="muted"
        />
        <MiniStat label="Gaji pokok / bulan" value={rupiah(totalGajiPokok)} />
      </div>

      <Card inset>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, NIK, atau jabatan…"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] text-text placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <select
            value={divisi}
            onChange={(e) => setDivisi(e.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] text-text focus:border-brand focus:outline-none"
          >
            <option value="semua">Semua divisi</option>
            {DIVISI.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12.5px] text-muted select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="size-3.5 accent-[var(--brand)]"
            />
            Tampilkan nonaktif
          </label>
        </div>

        {rows.length ? (
          <Table minWidth={860}>
            <thead>
              <tr>
                <Th>Karyawan</Th>
                <Th>Jabatan</Th>
                <Th>Rekening</Th>
                <Th align="right">Gaji pokok</Th>
                <Th align="right">Transport</Th>
                <Th align="center">Status</Th>
                <Th align="right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <Tr key={k.id} className="cursor-pointer" onClick={() => openEdit(k)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar nama={k.nama} id={k.id} size="sm" className={k.aktif ? "" : "opacity-50"} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text">{k.nama}</p>
                        <p className="font-mono text-[11px] text-subtle">{k.nik}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-text">{k.jabatan}</p>
                    <p className="text-[11.5px] text-subtle">{k.divisi}</p>
                  </Td>
                  <Td>
                    <p className="text-text">{k.bank}</p>
                    <p className="font-mono text-[11.5px] text-subtle">{k.noRekening}</p>
                  </Td>
                  <Td align="right">{rupiah(k.komponen.gajiPokok)}</Td>
                  <Td align="right">{rupiah(k.komponen.transportasi)}</Td>
                  <Td align="center">
                    {k.aktif ? (
                      <Badge tone="pos" dot>
                        Aktif
                      </Badge>
                    ) : (
                      <Badge tone="neutral" dot>
                        Nonaktif
                      </Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(k)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={k.aktif ? "Nonaktifkan" : "Aktifkan"}
                        onClick={() => {
                          setKaryawanAktif(k.id, !k.aktif);
                          toast.info(k.aktif ? "Karyawan dinonaktifkan" : "Karyawan diaktifkan", k.nama);
                        }}
                      >
                        {k.aktif ? (
                          <Ban className="size-4 text-neg" />
                        ) : (
                          <CircleCheck className="size-4 text-pos" />
                        )}
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<CircleUserRound />}
            title="Tidak ada karyawan cocok"
            desc="Coba ubah kata kunci pencarian atau filter divisi."
            action={
              <Button variant="secondary" onClick={() => { setQ(""); setDivisi("semua"); }}>
                Reset filter
              </Button>
            }
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId == null ? "Tambah Karyawan" : "Edit Karyawan"}
        description="Komponen gaji di bawah menjadi nilai awal setiap periode baru."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save}>{editId == null ? "Tambah" : "Simpan perubahan"}</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <SectionLabel className="mb-3 flex items-center gap-1.5">
              <CircleUserRound className="size-3.5" /> Identitas
            </SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Nama lengkap"
                required
                value={draft.nama}
                onChange={(e) => setDraft((d) => ({ ...d, nama: e.target.value }))}
                placeholder="mis. Budi Santoso"
              />
              <TextField
                label="NIK"
                required
                value={draft.nik}
                onChange={(e) => setDraft((d) => ({ ...d, nik: e.target.value }))}
                placeholder="AP-2026-000"
                className="font-mono"
              />
              <TextField
                label="Jabatan"
                value={draft.jabatan}
                onChange={(e) => setDraft((d) => ({ ...d, jabatan: e.target.value }))}
                placeholder="mis. Sales Counter"
              />
              <SelectField
                label="Divisi"
                value={draft.divisi}
                onChange={(e) => setDraft((d) => ({ ...d, divisi: e.target.value }))}
                options={DIVISI.map((d) => ({ value: d, label: d }))}
              />
              <TextField
                label="Tanggal masuk"
                type="date"
                value={draft.tanggalMasuk}
                onChange={(e) => setDraft((d) => ({ ...d, tanggalMasuk: e.target.value }))}
              />
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <SelectField
                  label="Bank"
                  value={draft.bank}
                  onChange={(e) => setDraft((d) => ({ ...d, bank: e.target.value }))}
                  options={BANKS.map((b) => ({ value: b, label: b }))}
                />
                <TextField
                  label="No. rekening"
                  value={draft.noRekening}
                  onChange={(e) => setDraft((d) => ({ ...d, noRekening: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <TextField
                label="Nama penerima transfer"
                wrapClass="sm:col-span-2"
                value={draft.namaPenerima}
                onChange={(e) => setDraft((d) => ({ ...d, namaPenerima: e.target.value }))}
                hint="Kosongkan untuk memakai nama lengkap."
              />
            </div>
          </div>

          <div>
            <SectionLabel className="mb-3 flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Komponen gaji default
            </SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumberField label="Gaji pokok" value={draft.komponen.gajiPokok} onValue={(v) => setK("gajiPokok", v)} />
              <NumberField label="Transportasi" value={draft.komponen.transportasi} onValue={(v) => setK("transportasi", v)} />
              <NumberField label="BPJS (potongan)" value={draft.komponen.bpjs} onValue={(v) => setK("bpjs", v)} />
              <NumberField
                label="Rate uang makan / hari"
                value={draft.komponen.rateUangMakan}
                onValue={(v) => setK("rateUangMakan", v)}
              />
              <NumberField
                label="Rate lembur / hari"
                value={draft.komponen.rateLembur}
                onValue={(v) => setK("rateLembur", v)}
              />
              <NumberField label="Bayar mess (potongan)" value={draft.komponen.bayarMess} onValue={(v) => setK("bayarMess", v)} />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

function MiniStat({
  label,
  value,
  tone = "text",
}: {
  label: string;
  value: string;
  tone?: "text" | "pos" | "muted";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="text-[11.5px] font-medium text-subtle">{label}</p>
      <p
        className={
          "tnum mt-1 text-[17px] font-semibold " +
          (tone === "pos" ? "text-pos" : tone === "muted" ? "text-muted" : "text-text")
        }
      >
        {value}
      </p>
    </div>
  );
}
