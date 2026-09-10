import { useState } from "react";
import {
  ShieldCheck,
  DatabaseBackup,
  FolderOpen,
  KeyRound,
  Fingerprint,
  HardDrive,
  TriangleAlert,
  RotateCcw,
  Cpu,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { KeyValue, SectionLabel } from "@/components/ui/misc";
import { Table, Th, Td, Tr } from "@/components/ui/Table";
import { Modal, ConfirmBody } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Field";
import { LogoMark } from "@/components/brand/Logo";
import { brand, appTitle } from "@/config/brand";
import { toast } from "@/components/ui/toast";
import { usePayroll } from "@/data/store";
import { getDeviceFingerprint } from "@/lib/device";
import { tanggalPanjang, waktuRelatif } from "@/lib/format";

const TRIGGER_LABEL: Record<string, string> = {
  manual: "Manual",
  "auto-close": "Auto (tutup app)",
  "transfer-lisensi": "Transfer lisensi",
};

export default function BackupLisensi() {
  const { backups, lastBackupAt, deviceBoundAt, createBackup, rebindDevice, resetAll } = usePayroll();
  const fp = getDeviceFingerprint();

  const [transferOpen, setTransferOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pw, setPw] = useState("");

  return (
    <>
      <PageHeader
        title="Backup & Lisensi"
        description="Status enkripsi, kunci perangkat, arsip cadangan otomatis, dan transfer lisensi antar komputer."
        actions={
          <Button
            icon={<DatabaseBackup />}
            onClick={() => {
              const e = createBackup("manual");
              toast.success("Backup manual dibuat", e.path.split("/").pop());
            }}
          >
            Backup sekarang
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Device lock */}
        <Card>
          <CardHeader
            title="Kunci perangkat"
            subtitle="Database terikat kriptografis ke komputer ini"
            icon={<Fingerprint />}
            actions={<Badge tone="pos" dot>Aktif</Badge>}
          />
          <CardBody>
            <div className="rounded-lg border border-border bg-surface-2/50 p-3">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                Device fingerprint (SHA-256)
              </p>
              <p className="break-all font-mono text-[11.5px] leading-relaxed text-brand">{fp.short}</p>
            </div>
            <dl className="mt-2 divide-y divide-border">
              <KeyValue label={<span className="flex items-center gap-1.5"><HardDrive className="size-3.5" /> Volume Serial</span>} mono>
                {fp.volumeSerial}
              </KeyValue>
              <KeyValue label={<span className="flex items-center gap-1.5"><Cpu className="size-3.5" /> Machine GUID</span>} mono>
                {fp.machineGuid}
              </KeyValue>
              <KeyValue label="Hostname" mono>
                {fp.hostname}
              </KeyValue>
              <KeyValue label="Kunci diikat sejak">{tanggalPanjang(deviceBoundAt)}</KeyValue>
              <KeyValue label="Key derivation" mono>
                Argon2id · SQLCipher
              </KeyValue>
            </dl>
            <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-[12px] leading-relaxed text-info">
              Jika <span className="font-mono text-[11px]">payroll.db.enc</span> disalin ke perangkat lain,
              fingerprint tidak cocok → SQLCipher gagal decrypt → file dianggap rusak di sana. Datanya sendiri
              tidak dihapus.
            </p>
          </CardBody>
        </Card>

        {/* Backup status */}
        <Card>
          <CardHeader
            title="Cadangan otomatis"
            subtitle="Retensi 30 arsip terakhir"
            icon={<ShieldCheck />}
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon={<FolderOpen />}
                onClick={() => toast.info("Buka folder", "Documents/PayrollApp/backups/ — di build Tauri folder ini terbuka di Explorer.")}
              >
                Folder
              </Button>
            }
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                <p className="text-[11.5px] text-subtle">Backup terakhir</p>
                <p className="mt-0.5 text-[14px] font-semibold text-text">{waktuRelatif(lastBackupAt)}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                <p className="text-[11.5px] text-subtle">Arsip tersimpan</p>
                <p className="tnum mt-0.5 text-[14px] font-semibold text-text">{backups.length} file</p>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <Table minWidth={0}>
                <thead>
                  <tr>
                    <Th>Waktu</Th>
                    <Th>Pemicu</Th>
                    <Th align="right">Ukuran</Th>
                  </tr>
                </thead>
                <tbody>
                  {backups.slice(0, 6).map((b) => (
                    <Tr key={b.id}>
                      <Td className="whitespace-nowrap text-muted">{waktuRelatif(b.createdAt)}</Td>
                      <Td>
                        <Badge tone={b.trigger === "manual" ? "brand" : "neutral"}>
                          {TRIGGER_LABEL[b.trigger] ?? b.trigger}
                        </Badge>
                      </Td>
                      <Td align="right" className="text-muted">
                        {b.sizeKb} KB
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>

        {/* Transfer lisensi */}
        <Card>
          <CardHeader title="Transfer Lisensi" subtitle="Khusus admin — pindahkan data ke komputer baru" icon={<KeyRound />} />
          <CardBody className="space-y-3">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Meng-enkripsi ulang database dengan fingerprint perangkat tujuan. Dipakai saat PC kantor
              diganti/rusak sehingga data tidak hilang selamanya. Butuh password transfer terpisah.
            </p>
            <Button
              variant="secondary"
              icon={<KeyRound />}
              onClick={() => {
                setPw("");
                setTransferOpen(true);
              }}
            >
              Mulai transfer lisensi
            </Button>
          </CardBody>
        </Card>

        {/* About + danger */}
        <Card>
          <CardHeader title="Tentang aplikasi" icon={<LogoMark size={18} />} />
          <CardBody>
            <dl className="divide-y divide-border">
              <KeyValue label="Produk">{`${appTitle} — ${brand.vendor.product}`}</KeyValue>
              <KeyValue label="Versi" mono>
                {brand.vendor.version} · frontend preview
              </KeyValue>
              <KeyValue label="Target">Tauri v2 · Rust · SQLCipher</KeyValue>
              <KeyValue label="Lisensi">{`Internal — ${brand.company.name}`}</KeyValue>
              <KeyValue label="Pengembang">{brand.vendor.name}</KeyValue>
            </dl>

            <SectionLabel className="mb-2 mt-5 flex items-center gap-1.5 text-neg">
              <TriangleAlert className="size-3.5" /> Zona berbahaya
            </SectionLabel>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-neg/30 bg-neg-soft px-3 py-2.5">
              <p className="text-[12px] text-muted">Kembalikan seluruh data ke kondisi contoh awal.</p>
              <Button variant="danger" size="sm" icon={<RotateCcw />} onClick={() => setResetOpen(true)}>
                Reset data
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-subtle">
        <LogoMark size={14} />
        Dibuat oleh <span className="font-semibold text-muted">{brand.vendor.name}</span> · payroll offline, data tidak pernah meninggalkan perangkat.
      </p>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Lisensi"
        description="Masukkan password transfer admin untuk mengikat ulang database ke perangkat ini."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (pw.trim().length < 4) {
                  toast.error("Password kurang", "Minimal 4 karakter (demo).");
                  return;
                }
                rebindDevice();
                createBackup("transfer-lisensi");
                toast.success("Lisensi ditransfer", "Database di-enkripsi ulang ke fingerprint perangkat ini.");
                setTransferOpen(false);
              }}
            >
              Transfer
            </Button>
          </>
        }
      >
        <TextField
          label="Password transfer"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••••"
          addonRight={<KeyRound />}
        />
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Di build asli, langkah ini hanya berhasil bila password cocok dengan hash yang tersimpan di{" "}
          <span className="font-mono text-[11px]">app_meta</span>, lalu seluruh baris di-recrypt.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset seluruh data?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetAll();
                toast.warn("Data direset", "Semua karyawan, periode, dan hutang kembali ke contoh awal.");
                setResetOpen(false);
              }}
            >
              Ya, reset
            </Button>
          </>
        }
      >
        <ConfirmBody>
          Tindakan ini menghapus semua perubahanmu di preview ini dan memuat ulang data contoh. Tidak bisa
          dibatalkan.
        </ConfirmBody>
      </Modal>
    </>
  );
}
