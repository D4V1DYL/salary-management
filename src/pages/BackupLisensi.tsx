import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  DatabaseBackup,
  FolderOpen,
  KeyRound,
  Fingerprint,
  TriangleAlert,
  RotateCcw,
  Clock,
  Copy,
  Check,
  Upload,
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
import { useLicense } from "@/data/license";
import { inElectron, isUsable, type BackupFileInfo } from "@/lib/electron";
import { tanggalPanjang, waktuRelatif } from "@/lib/format";

const TRIGGER_LABEL: Record<string, string> = {
  manual: "Manual",
  "auto-close": "Auto (tutup app)",
  "transfer-lisensi": "Transfer lisensi",
};

export default function BackupLisensi() {
  const { backups: mockBackups, lastBackupAt, createBackup, importSnapshot, resetAll } = usePayroll();
  const { status, refresh, activate } = useLicense();
  const [restoreData, setRestoreData] = useState<{ path: string; content: string } | null>(null);

  const [realBackups, setRealBackups] = useState<BackupFileInfo[] | null>(null);
  const loadBackups = () => {
    if (inElectron()) window.electronAPI!.listBackups().then(setRealBackups).catch(() => {});
  };
  useEffect(() => {
    refresh().catch(() => {});
    loadBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In the desktop app show the real files on disk; in web preview, the mock list.
  const backups = useMemo(
    () =>
      realBackups
        ? realBackups.map((b) => ({ id: b.id, createdAt: b.createdAt, trigger: b.trigger, sizeKb: b.sizeKb, path: b.path }))
        : mockBackups,
    [realBackups, mockBackups]
  );
  const lastBackup = backups[0]?.createdAt ?? lastBackupAt;

  const state = status?.state;
  const trial = state === "trial";
  const licensed = state === "full";
  const needsActivation = status ? !isUsable(status) : false;
  const deviceCode = status?.fingerprint.short ?? "…";

  const [activateOpen, setActivateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(deviceCode).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {}
    );
  }

  return (
    <>
      <PageHeader
        title="Backup & Lisensi"
        description="Status lisensi, arsip cadangan otomatis, dan transfer lisensi antar komputer."
        actions={
          <Button
            icon={<DatabaseBackup />}
            onClick={() => {
              const e = createBackup("manual");
              toast.success("Backup manual dibuat", e.path.split(/[\\/]/).pop());
              setTimeout(loadBackups, 300);
            }}
          >
            Backup sekarang
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* License / device lock */}
        <Card>
          <CardHeader
            title="Lisensi"
            subtitle="Status lisensi aplikasi untuk komputer ini"
            icon={<Fingerprint />}
            actions={
              <Badge tone={licensed ? "pos" : trial ? "warn" : "neg"} dot>
                {licensed ? "Lisensi Penuh" : trial ? "Trial" : "Perlu aktivasi"}
              </Badge>
            }
          />
          <CardBody>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 p-4">
              <span
                className={
                  "grid size-10 shrink-0 place-items-center rounded-full " +
                  (licensed ? "bg-pos-soft text-pos" : trial ? "bg-warn-soft text-warn" : "bg-neg-soft text-neg")
                }
              >
                {licensed ? <ShieldCheck className="size-5" /> : trial ? <Clock className="size-5" /> : <TriangleAlert className="size-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-text">
                  {licensed
                    ? "Lisensi penuh aktif"
                    : trial
                      ? `Mode trial — ${status?.daysLeft} hari tersisa`
                      : state === "trial-expired"
                        ? "Masa trial berakhir"
                        : "Lisensi tidak aktif di perangkat ini"}
                </p>
                <p className="text-[12px] text-subtle">
                  {licensed && status?.activatedAt
                    ? `Diaktifkan ${tanggalPanjang(status.activatedAt)}`
                    : trial
                      ? `dari total ${status?.trialDays} hari masa trial`
                      : "masukkan kode aktivasi untuk melanjutkan"}
                </p>
              </div>
            </div>

            {trial && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-muted">Sisa masa trial</span>
                  <span className="tnum font-semibold text-warn">
                    {status?.daysLeft} / {status?.trialDays} hari
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-warn transition-[width] duration-500"
                    style={{ width: `${((status?.daysLeft ?? 0) / (status?.trialDays || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Device code + activation */}
            {(trial || needsActivation) && (
              <>
                <div className="mt-3 rounded-lg border border-border bg-surface-2/50 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">
                      Kode Perangkat
                    </p>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 text-[10.5px] font-medium text-muted transition-colors hover:text-text"
                    >
                      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                  <p className="break-all font-mono text-[12px] leading-relaxed text-brand">{deviceCode}</p>
                </div>
                <Button
                  className="mt-3 w-full"
                  icon={<KeyRound />}
                  onClick={() => {
                    setKey("");
                    setKeyError("");
                    setActivateOpen(true);
                  }}
                >
                  {needsActivation ? "Aktifkan Lisensi" : "Aktifkan Lisensi Penuh"}
                </Button>
              </>
            )}

            <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-[12px] leading-relaxed text-info">
              Aplikasi ini hanya berjalan di komputer yang lisensinya diaktifkan. Kalau kamu mengganti
              atau meng-upgrade komputer, kirim <span className="font-medium">Kode Perangkat</span> di atas ke{" "}
              {brand.vendor.name} untuk mendapat kode aktivasi baru (transfer lisensi).
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Upload />}
                  onClick={async () => {
                    if (!inElectron()) {
                      toast.info("Pulihkan", "Fitur pulihkan hanya tersedia di aplikasi desktop.");
                      return;
                    }
                    const picked = await window.electronAPI!.pickRestoreBackup();
                    if (picked) setRestoreData(picked);
                  }}
                >
                  Pulihkan
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FolderOpen />}
                  onClick={() => {
                    if (inElectron()) {
                      window.electronAPI!.openBackupFolder();
                    } else {
                      toast.info("Buka folder", "Documents/PayrollApp/backups/ — cuma bisa dibuka dari aplikasi desktop.");
                    }
                  }}
                >
                  Folder
                </Button>
              </div>
            }
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-2/50 p-3">
                <p className="text-[11.5px] text-subtle">Backup terakhir</p>
                <p className="mt-0.5 text-[14px] font-semibold text-text">{waktuRelatif(lastBackup)}</p>
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

        {/* Aktivasi / Transfer lisensi */}
        <Card>
          <CardHeader title="Aktivasi & Transfer Lisensi" subtitle="Aktifkan lisensi penuh atau pindah ke komputer baru" icon={<KeyRound />} />
          <CardBody className="space-y-3">
            <ol className="space-y-2 text-[12.5px] leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">1</span>
                Salin <span className="font-medium text-text">Kode Perangkat</span> di kartu Lisensi.
              </li>
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">2</span>
                Kirim kode itu ke {brand.vendor.name} untuk mendapat kode aktivasi.
              </li>
              <li className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">3</span>
                Masukkan kode aktivasi di sini. Kode hanya berlaku untuk komputer ini.
              </li>
            </ol>
            <Button
              variant={licensed ? "secondary" : "primary"}
              className="w-full"
              icon={<KeyRound />}
              onClick={() => {
                setKey("");
                setKeyError("");
                setActivateOpen(true);
              }}
            >
              {licensed ? "Masukkan kode aktivasi" : "Aktifkan lisensi penuh"}
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
                {brand.vendor.version} {inElectron() ? "· desktop" : "· web preview"}
              </KeyValue>
              <KeyValue label="Target">Aplikasi desktop offline</KeyValue>
              <KeyValue label="Lisensi">{licensed ? "Penuh" : trial ? `Trial (${status?.daysLeft} hari lagi)` : "Belum aktif"}</KeyValue>
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
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Aktivasi Lisensi"
        description="Masukkan kode aktivasi yang diberikan untuk komputer ini."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActivateOpen(false)}>
              Batal
            </Button>
            <Button
              loading={activating}
              onClick={async () => {
                setKeyError("");
                setActivating(true);
                try {
                  const next = await activate(key);
                  if (isUsable(next) && next.state === "full") {
                    createBackup("transfer-lisensi");
                    toast.success("Lisensi diaktifkan", "Aplikasi sekarang berlisensi penuh untuk perangkat ini.");
                    setActivateOpen(false);
                    setKey("");
                  } else {
                    setKeyError("Kode aktivasi tidak valid untuk perangkat ini.");
                  }
                } catch (e) {
                  setKeyError(e instanceof Error ? e.message : "Kode aktivasi tidak valid.");
                } finally {
                  setActivating(false);
                }
              }}
            >
              Aktifkan
            </Button>
          </>
        }
      >
        <div className="mb-3 rounded-lg border border-border bg-surface-2/50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle">Kode Perangkat</p>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-[10.5px] font-medium text-muted transition-colors hover:text-text"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
          <p className="break-all font-mono text-[12px] leading-relaxed text-brand">{deviceCode}</p>
        </div>
        <TextField
          label="Kode aktivasi"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          addonRight={<KeyRound />}
          error={keyError}
          className="font-mono uppercase tracking-wider"
        />
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Kirim Kode Perangkat di atas ke {brand.vendor.name} untuk mendapatkan kode aktivasi.
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
          Tindakan ini menghapus seluruh data saat ini dan memuat ulang data contoh awal. Tidak bisa
          dibatalkan — pastikan kamu sudah punya backup bila datanya penting.
        </ConfirmBody>
      </Modal>

      <Modal
        open={restoreData != null}
        onClose={() => setRestoreData(null)}
        title="Pulihkan dari backup?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestoreData(null)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!restoreData) return;
                const ok = importSnapshot(restoreData.content);
                if (ok) {
                  toast.success("Data dipulihkan", restoreData.path.split(/[\\/]/).pop());
                  loadBackups();
                } else {
                  toast.error("Gagal memulihkan", "File backup tidak valid atau rusak.");
                }
                setRestoreData(null);
              }}
            >
              Ya, pulihkan
            </Button>
          </>
        }
      >
        <ConfirmBody>
          Seluruh data saat ini akan <strong>diganti</strong> dengan isi file backup
          {restoreData ? ` "${restoreData.path.split(/[\\/]/).pop()}"` : ""}. Sebaiknya buat backup dulu
          sebelum memulihkan.
        </ConfirmBody>
      </Modal>
    </>
  );
}
