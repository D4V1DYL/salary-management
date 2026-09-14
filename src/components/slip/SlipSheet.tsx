import { LogoMark } from "@/components/brand/Logo";
import { brand, appTitle } from "@/config/brand";
import type { Karyawan, PayrollDetail, PayrollPeriode } from "@/data/types";
import { labelPeriode, rupiah, tanggalPanjang, terbilang } from "@/lib/format";

const EARN_ROWS: { key: keyof PayrollDetail; label: string; always?: boolean }[] = [
  { key: "gajiPokok", label: "Gaji Pokok", always: true },
  { key: "transportasi", label: "Tunjangan Transportasi" },
  { key: "totalUangMakan", label: "Uang Makan" },
  { key: "totalLembur", label: "Lembur" },
  { key: "insentif", label: "Insentif" },
  { key: "tambahan", label: "Tambahan" },
  { key: "bonusDisiplin", label: "Bonus Disiplin" },
  { key: "komisiArloji", label: "Komisi Penjualan Arloji" },
  { key: "komisiReparasi", label: "Komisi Reparasi" },
  { key: "thr", label: "THR" },
];

const DEDUCT_ROWS: { key: keyof PayrollDetail; label: string }[] = [
  { key: "potonganHutang", label: "Angsuran Hutang / Kasbon" },
  { key: "bpjs", label: "BPJS" },
  { key: "bayarMess", label: "Iuran Mess" },
  { key: "pph21", label: "PPh 21" },
];

/**
 * On-screen preview + print target. Always rendered light — a payslip is a
 * document, not a themed UI surface.
 */
export function SlipSheet({
  karyawan,
  detail,
  periode,
  className = "",
}: {
  karyawan: Karyawan;
  detail: PayrollDetail;
  periode: PayrollPeriode;
  className?: string;
}) {
  const earns = EARN_ROWS.filter((r) => r.always || Number(detail[r.key]) > 0);
  const deducts = DEDUCT_ROWS.filter((r) => Number(detail[r.key]) > 0);

  return (
    <div
      className={`slip-page mx-auto w-[210mm] max-w-full bg-white p-[14mm] font-sans text-[#0f2438] shadow-[0_1px_2px_rgba(9,23,37,0.08),0_10px_40px_-12px_rgba(9,23,37,0.18)] ${className}`}
      style={{ colorScheme: "light" }}
    >
      {/* header */}
      <div className="flex items-start justify-between border-b-2 border-[#183b5b] pb-4">
        <div className="flex items-start gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-[#183b5b] text-white">
            <span className="text-[15px] font-black tracking-tight">{brand.company.initials}</span>
          </div>
          <div>
            <p className="text-[16px] font-bold leading-tight text-[#183b5b]">{brand.company.legalName}</p>
            <p className="text-[11px] leading-tight text-[#566878]">
              {brand.company.address}
              {brand.company.npwp ? ` · NPWP ${brand.company.npwp}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[15px] font-bold tracking-[0.02em] text-[#183b5b]">SLIP GAJI</p>
          <p className="text-[12px] font-semibold text-[#0f2438]">
            {labelPeriode(periode.bulan, periode.tahun)}
          </p>
          <p className="mt-0.5 inline-block rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#8695a6]">
            Rahasia
          </p>
        </div>
      </div>

      {/* employee meta */}
      <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11.5px]">
        <Meta label="Nama" value={karyawan.nama} strong />
        <Meta label="NIK" value={karyawan.nik} mono />
        <Meta label="Jabatan" value={karyawan.jabatan} />
        <Meta label="Divisi" value={karyawan.divisi} />
        <Meta label="Bank / Rekening" value={`${karyawan.bank} · ${karyawan.noRekening}`} mono />
        <Meta label="Tanggal cetak" value={tanggalPanjang(new Date().toISOString())} />
      </div>

      {/* penerimaan / potongan */}
      <div className="mt-5 grid grid-cols-2 gap-5">
        <SlipColumn title="Penerimaan" tone="#0a7d57">
          {earns.map((r) => (
            <SlipLine key={r.key} label={r.label} value={Number(detail[r.key])} />
          ))}
          <SlipSubtotal label="Total Penerimaan" value={detail.totalPenerimaan} tone="#0a7d57" />
        </SlipColumn>

        <SlipColumn title="Potongan" tone="#c02026">
          {deducts.length ? (
            deducts.map((r) => <SlipLine key={r.key} label={r.label} value={Number(detail[r.key])} />)
          ) : (
            <p className="py-1 text-[11px] italic text-[#8695a6]">Tidak ada potongan.</p>
          )}
          <SlipSubtotal label="Total Potongan" value={detail.totalPotongan} tone="#c02026" />
        </SlipColumn>
      </div>

      {/* transfer band */}
      <div className="mt-5 flex items-center justify-between rounded-lg bg-[#183b5b] px-5 py-3.5 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
            Gaji Dibayarkan
          </p>
          <p className="text-[11px] italic text-white/75">{terbilang(detail.gajiTransfer)}</p>
        </div>
        <p className="tnum text-[20px] font-bold">{rupiah(detail.gajiTransfer)}</p>
      </div>

      {/* signatures */}
      <div className="mt-8 grid grid-cols-2 gap-8 text-[11px]">
        <Sign role="Dibuat oleh" name="Bag. Keuangan" />
        <Sign role="Diterima oleh" name={karyawan.namaPenerima || karyawan.nama} />
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[#e3e9f1] pt-3 text-[9px] text-[#8695a6]">
        <span className="flex items-center gap-1.5">
          <LogoMark size={13} /> Dokumen dibuat otomatis oleh <b className="font-semibold text-[#566878]">{appTitle}</b> &middot; snapshot tanpa formula.
        </span>
        <span className="font-mono">{karyawan.nik}/{periode.bulan}-{periode.tahun}</span>
      </div>
    </div>
  );
}

function Meta({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-[110px] shrink-0 text-[#8695a6]">{label}</span>
      <span className={`text-[#0f2438] ${strong ? "font-bold" : "font-medium"} ${mono ? "font-mono text-[10.5px]" : ""}`}>
        : {value}
      </span>
    </div>
  );
}

function SlipColumn({ title, tone, children }: { title: string; tone: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="mb-1 border-b-2 pb-1 text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone, borderColor: tone }}
      >
        {title}
      </p>
      <div className="divide-y divide-[#eef2f8]">{children}</div>
    </div>
  );
}

function SlipLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11.5px]">
      <span className="text-[#566878]">{label}</span>
      <span className="tnum font-medium text-[#0f2438]">{rupiah(value)}</span>
    </div>
  );
}

function SlipSubtotal({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between border-t-2 pt-1.5 text-[11.5px]" style={{ borderColor: tone }}>
      <span className="font-bold" style={{ color: tone }}>
        {label}
      </span>
      <span className="tnum font-bold" style={{ color: tone }}>
        {rupiah(value)}
      </span>
    </div>
  );
}

function Sign({ role, name }: { role: string; name: string }) {
  return (
    <div>
      <p className="text-[#8695a6]">{role},</p>
      <div className="mt-12 border-t border-[#0f2438] pt-1 font-semibold text-[#0f2438]">{name}</div>
    </div>
  );
}
