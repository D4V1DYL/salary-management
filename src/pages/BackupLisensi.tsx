import { useEffect, useState } from "react";
import {
  ShieldCheck,
  DatabaseBackup,
  FolderOpen,
  KeyRound,
  Fingerprint,
  TriangleAlert,
  RotateCcw,
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
import { fetchLicenseStatus, inTauri, transferLicense, type LicenseStatus } from "@/lib/useLicense";
import { tanggalPanjang, waktuRelatif } from "@/lib/format";

const TRIGGER_LABEL: Record<string, string> = {
  manual: "Manual",
  "auto-close": "Auto (tutup app)",
  "transfer-lisensi": "Transfer lisensi",
};

export default function BackupLisensi() {
  const { backups, lastBackupAt, createBackup, resetAll } = usePayroll();
  const [status, setStatus] = useState<LicenseStatus | null>(null);

  useEffect(() => {
    fetchLicenseStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);
  const licensed = status ? status.matches : true; // optimistic while loading

  const [transferOpen, setTransferOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [transferring, setTransferring] = useState(false);

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
            subtitle="Lisensi aplikasi untuk komputer ini"
            icon={<Fingerprint />}
            actions={
              <Badge tone={licensed ? "pos" : "neg"} dot>
                {licensed ? "Aktif" : "Perlu aktivasi"}
              </Badge>
            }
          />
          <CardBody>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pos-soft text-pos">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-text">
                  {licensed ? "Lisensi aktif untuk perangkat ini" : "Lisensi belum aktif di perangkat ini"}
                </p>
                <p className="text-[12px] text-subtle">
                  {status?.boundAt ? `Terverifikasi sejak ${tanggalPanjang(status.boundAt)}` : "Memuat status…"}
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-[12px] leading-relaxed text-info">
              Aplikasi ini hanya berjalan di perangkat yang terdaftar untuk lisensi ini. Kalau kamu
              mengganti atau meng-upgrade komputer, hubungi admin untuk proses Transfer Lisensi.
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
              Mengaktifkan ulang lisensi aplikasi untuk komputer ini. Dipakai saat PC diganti atau
              di-upgrade supaya data tidak hilang. Butuh password khusus admin.
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
                {brand.vendor.version} {inTauri() ? "· desktop" : "· web preview"}
              </KeyValue>
              <KeyValue label="Target">Aplikasi desktop offline</KeyValue>
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
              loading={transferring}
              onClick={async () => {
                setPwError("");
                setTransferring(true);
                try {
                  const next = await transferLicense(pw);
                  setStatus(next);
                  createBackup("transfer-lisensi");
                  toast.success("Lisensi diaktifkan", "Aplikasi sekarang aktif untuk perangkat ini.");
                  setTransferOpen(false);
                  setPw("");
                } catch (e) {
                  setPwError(e instanceof Error ? e.message : "Password transfer salah.");
                } finally {
                  setTransferring(false);
                }
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
          error={pwError}
        />
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Hubungi admin kalau kamu tidak tahu password ini.
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
