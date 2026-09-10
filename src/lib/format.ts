const idr0 = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const num0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** "Rp 4.250.000" */
export function rupiah(value: number | null | undefined): string {
  return idr0.format(Math.round(Number(value ?? 0)));
}

/** Compact for stat cards: "Rp 4,25 jt" / "Rp 1,20 M" */
export function rupiahCompact(value: number | null | undefined): string {
  const v = Math.round(Number(value ?? 0));
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  if (abs >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(2).replace(".", ",")} jt`;
  if (abs >= 1_000) return `Rp ${(v / 1_000).toFixed(0)} rb`;
  return rupiah(v);
}

/** Plain grouped number, no currency symbol — for editable table cells. */
export function angka(value: number | null | undefined): string {
  return num0.format(Math.round(Number(value ?? 0)));
}

/** Parse "4.250.000" / "Rp 4.250.000" / "4250000" -> 4250000 */
export function parseAngka(raw: string): number {
  const cleaned = raw.replace(/[^\d-]/g, "");
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

export const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const BULAN_SINGKAT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** periode label: (7, 2025) -> "Juli 2025" */
export function labelPeriode(bulan: number, tahun: number): string {
  return `${BULAN[(bulan - 1 + 12) % 12]} ${tahun}`;
}

export function tanggalPanjang(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function tanggalPendek(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function waktuRelatif(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const jam = Math.round(min / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return tanggalPendek(iso);
}

const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

function terbilangInt(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${terbilangInt(n - 10)} belas`;
  if (n < 100) return `${terbilangInt(Math.floor(n / 10))} puluh ${terbilangInt(n % 10)}`.trim();
  if (n < 200) return `seratus ${terbilangInt(n - 100)}`.trim();
  if (n < 1000) return `${terbilangInt(Math.floor(n / 100))} ratus ${terbilangInt(n % 100)}`.trim();
  if (n < 2000) return `seribu ${terbilangInt(n - 1000)}`.trim();
  if (n < 1_000_000) return `${terbilangInt(Math.floor(n / 1000))} ribu ${terbilangInt(n % 1000)}`.trim();
  if (n < 1_000_000_000)
    return `${terbilangInt(Math.floor(n / 1_000_000))} juta ${terbilangInt(n % 1_000_000)}`.trim();
  return `${terbilangInt(Math.floor(n / 1_000_000_000))} miliar ${terbilangInt(n % 1_000_000_000)}`.trim();
}

/** "4250000" -> "Empat juta dua ratus lima puluh ribu rupiah" */
export function terbilang(n: number): string {
  const neg = n < 0;
  const words = terbilangInt(n).replace(/\s+/g, " ").trim() || "nol";
  const cap = words.charAt(0).toUpperCase() + words.slice(1);
  return `${neg ? "Minus " : ""}${cap} rupiah`;
}

export function initials(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
