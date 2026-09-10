# DM Tech Payroll — Payroll Suite

Aplikasi payroll **desktop offline** untuk toko (studi kasus: Toko Jam "Arloji Prima").
Dibangun dari [`rancangan-mvp-payroll-app.md`](../rancangan-mvp-payroll-app.md).

Status saat ini: **Fase 1–2 (frontend-first), desain penuh.**
Semua 7 halaman UI sudah jadi dengan _mock data_ + engine kalkulasi rumus asli yang jalan di
frontend. Backend Rust (SQLCipher, device-lock, PDF, auto-backup) menyusul di fase berikutnya.

## Stack

| Bagian | Teknologi |
|---|---|
| Shell | Tauri v2 (Rust) — belum diisi logika, baru window |
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 — sistem editorial: kanvas near-white, border hairline `#e5e5e5` (bukan shadow), tipografi monokrom padat, satu aksen navy `#183B5B`, CTA near-black. Border-first = ringan dirender. |
| State | Zustand + persist (localStorage sebagai pengganti SQLite sementara) |
| Animasi | Framer Motion (transisi halaman + micro-interaction) |
| Ikon | lucide-react · Font: Inter + IBM Plex Mono (self-hosted, offline) |

## Menjalankan

```bash
npm install
```

**Preview UI di browser (paling cepat):**

```bash
npm run dev
# buka http://localhost:1420
```

**Jalankan sebagai aplikasi desktop (butuh Rust toolchain):**

```bash
npm run tauri dev
```

**Build installer 1 file (.exe / .msi):**

```bash
npm run tauri build
```

Cek tipe & bundle produksi:

```bash
npm run build
```

## Branding — ganti nama perusahaan klien

Semua nama perusahaan/vendor ada di satu tempat: [`src/config/brand.ts`](src/config/brand.ts),
dengan override lewat `.env` (salin dari `.env.example`):

```bash
cp .env.example .env      # lalu edit, restart `npm run dev`
```

```env
VITE_COMPANY_NAME="CV Sumber Rejeki Makmur"      # nama klien di sidebar, About, lock screen
VITE_COMPANY_LEGAL_NAME="CV SUMBER REJEKI MAKMUR" # nama di kop slip gaji
VITE_COMPANY_INITIALS="SR"                        # inisial di tile kop slip
VITE_COMPANY_ADDRESS="Jl. Diponegoro No. 14, Semarang"
VITE_COMPANY_NPWP="01.234.567.8-503.000"
# Vendor (DM Tech) — biarkan default kecuali me-rebrand produknya
VITE_VENDOR_NAME="DM Tech"
VITE_PRODUCT_NAME="Payroll Suite"
VITE_APP_VERSION="0.1.0"
```

Nilai kosong / var tak diisi → jatuh ke default di `brand.ts`. Tidak ada nama perusahaan
yang di-hardcode di komponen lain. Logo DM Tech: [`src/components/brand/Logo.tsx`](src/components/brand/Logo.tsx)
(cincin emas + disc hitam + monogram serif, mengikuti `VITE_VENDOR_NAME`).

## Struktur

```
src/
  data/        types.ts · mock.ts (seed) · store.ts (zustand)
  lib/         payroll.ts (rumus dari tes_gajian.xlsm) · format.ts (rupiah, terbilang) ·
               device.ts (mock fingerprint) · theme.ts · nav.ts
  components/
    brand/     Logo.tsx  — mark & wordmark DM Tech
    layout/    AppShell · Sidebar · Topbar · PageHeader · LockScreen
    slip/      SlipSheet.tsx  — layout slip gaji (target print → PDF)
    ui/        Button · Card · Badge · Field · Modal · Table · Stat · charts · toast · …
  pages/       Dashboard · DataKaryawan · InputGaji · SlipGaji ·
               HutangKaryawan · RekapHutang · BackupLisensi
src-tauri/     shell Tauri v2 (window + command `greet` placeholder)
```

## Rumus payroll (dari `tes_gajian.xlsm`)

```
Total Uang Makan = rate_uang_makan × hari_makan
Total Lembur     = rate_lembur × hari_lembur
Total Penerimaan = Gaji Pokok + Transport + Total Uang Makan + Total Lembur
                 + Insentif + Tambahan + Bonus Disiplin
                 + Komisi Arloji + Komisi Reparasi + THR
Total Potongan   = Hutang + BPJS + Bayar Mess + PPh21
Gaji Transfer    = Total Penerimaan − Total Potongan
```

Semua tersimpan sebagai **snapshot** per karyawan per periode (`PayrollDetail`) — tidak ada
formula hidup, jadi bebas dari `#REF!`/`#N/A` seperti di file Excel asli. Saldo hutang juga
dihitung ulang dari transaksi mentah setiap kali dibuka.

## Catatan preview

- Data contoh disimpan di `localStorage` (`dmtech.payroll.db`). Tombol **Reset data** di
  halaman Backup & Lisensi mengembalikan ke seed awal.
- **Export PDF** memakai `window.print()` + stylesheet `@media print` — pilih "Save as PDF".
- Lock screen & device fingerprint bersifat kosmetik di preview ini; enkripsi asli ada di
  fase backend.

---

© 2026 DM Tech · payroll offline, data tidak pernah meninggalkan perangkat.
