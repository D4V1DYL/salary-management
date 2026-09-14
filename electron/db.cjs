// Real SQLite storage for the payroll data. Lives in the Electron main
// process; the renderer's zustand store syncs to it via IPC (db:load /
// db:save). Data is kept in normalized tables (not a JSON blob) so the
// resulting `payroll.db` opens cleanly in any SQLite browser.
const path = require("node:path");
const Database = require("better-sqlite3");

let db = null;

function open(userDataDir) {
  if (db) return db;
  db = new Database(path.join(userDataDir, "payroll.db"));
  db.pragma("journal_mode = WAL"); // durable + resilient to crashes mid-write
  db.exec(`
    CREATE TABLE IF NOT EXISTS karyawan (
      id INTEGER PRIMARY KEY, nik TEXT, nama TEXT, jabatan TEXT, divisi TEXT,
      noRekening TEXT, namaPenerima TEXT, bank TEXT, tanggalMasuk TEXT,
      aktif INTEGER, createdAt TEXT,
      gajiPokok INTEGER, transportasi INTEGER, rateUangMakan INTEGER,
      rateLembur INTEGER, bpjs INTEGER, bayarMess INTEGER
    );
    CREATE TABLE IF NOT EXISTS periode (
      id INTEGER PRIMARY KEY, bulan INTEGER, tahun INTEGER, status TEXT,
      createdAt TEXT, lockedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS payroll_detail (
      periodeId INTEGER, karyawanId INTEGER,
      gajiPokok INTEGER, transportasi INTEGER, rateUangMakan INTEGER, hariMakan INTEGER, totalUangMakan INTEGER,
      rateLembur INTEGER, hariLembur INTEGER, totalLembur INTEGER,
      insentif INTEGER, tambahan INTEGER, bonusDisiplin INTEGER, komisiArloji INTEGER, komisiReparasi INTEGER, thr INTEGER,
      potonganHutang INTEGER, bpjs INTEGER, bayarMess INTEGER, pph21 INTEGER,
      totalPenerimaan INTEGER, totalPotongan INTEGER, gajiTransfer INTEGER,
      PRIMARY KEY (periodeId, karyawanId)
    );
    CREATE TABLE IF NOT EXISTS hutang (
      id INTEGER PRIMARY KEY, karyawanId INTEGER, tanggal TEXT, keterangan TEXT,
      kasbon INTEGER, pelunasan INTEGER, saldoBerjalan INTEGER, periodeId INTEGER, createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS app_meta ( key TEXT PRIMARY KEY, value TEXT );
  `);
  return db;
}

const num = (v) => (v == null ? 0 : Math.round(Number(v) || 0));
const txt = (v) => (v == null ? null : String(v));

/**
 * Persist the renderer's serialized store (a JSON string in zustand-persist
 * shape) into normalized tables, atomically.
 */
function saveState(jsonString) {
  const parsed = JSON.parse(jsonString);
  const s = parsed?.state ?? parsed ?? {};
  const d = open(currentDir);

  const tx = d.transaction(() => {
    d.prepare("DELETE FROM karyawan").run();
    d.prepare("DELETE FROM periode").run();
    d.prepare("DELETE FROM payroll_detail").run();
    d.prepare("DELETE FROM hutang").run();

    const insK = d.prepare(`INSERT INTO karyawan
      (id,nik,nama,jabatan,divisi,noRekening,namaPenerima,bank,tanggalMasuk,aktif,createdAt,
       gajiPokok,transportasi,rateUangMakan,rateLembur,bpjs,bayarMess)
      VALUES (@id,@nik,@nama,@jabatan,@divisi,@noRekening,@namaPenerima,@bank,@tanggalMasuk,@aktif,@createdAt,
       @gajiPokok,@transportasi,@rateUangMakan,@rateLembur,@bpjs,@bayarMess)`);
    for (const k of s.karyawan ?? []) {
      const c = k.komponen ?? {};
      insK.run({
        id: k.id, nik: txt(k.nik), nama: txt(k.nama), jabatan: txt(k.jabatan), divisi: txt(k.divisi),
        noRekening: txt(k.noRekening), namaPenerima: txt(k.namaPenerima), bank: txt(k.bank),
        tanggalMasuk: txt(k.tanggalMasuk), aktif: k.aktif ? 1 : 0, createdAt: txt(k.createdAt),
        gajiPokok: num(c.gajiPokok), transportasi: num(c.transportasi), rateUangMakan: num(c.rateUangMakan),
        rateLembur: num(c.rateLembur), bpjs: num(c.bpjs), bayarMess: num(c.bayarMess),
      });
    }

    const insP = d.prepare(`INSERT INTO periode (id,bulan,tahun,status,createdAt,lockedAt)
      VALUES (@id,@bulan,@tahun,@status,@createdAt,@lockedAt)`);
    for (const p of s.periode ?? []) {
      insP.run({ id: p.id, bulan: num(p.bulan), tahun: num(p.tahun), status: txt(p.status), createdAt: txt(p.createdAt), lockedAt: txt(p.lockedAt) });
    }

    const insD = d.prepare(`INSERT INTO payroll_detail
      (periodeId,karyawanId,gajiPokok,transportasi,rateUangMakan,hariMakan,totalUangMakan,
       rateLembur,hariLembur,totalLembur,insentif,tambahan,bonusDisiplin,komisiArloji,komisiReparasi,thr,
       potonganHutang,bpjs,bayarMess,pph21,totalPenerimaan,totalPotongan,gajiTransfer)
      VALUES (@periodeId,@karyawanId,@gajiPokok,@transportasi,@rateUangMakan,@hariMakan,@totalUangMakan,
       @rateLembur,@hariLembur,@totalLembur,@insentif,@tambahan,@bonusDisiplin,@komisiArloji,@komisiReparasi,@thr,
       @potonganHutang,@bpjs,@bayarMess,@pph21,@totalPenerimaan,@totalPotongan,@gajiTransfer)`);
    for (const r of s.details ?? []) {
      insD.run({
        periodeId: num(r.periodeId), karyawanId: num(r.karyawanId),
        gajiPokok: num(r.gajiPokok), transportasi: num(r.transportasi), rateUangMakan: num(r.rateUangMakan),
        hariMakan: num(r.hariMakan), totalUangMakan: num(r.totalUangMakan), rateLembur: num(r.rateLembur),
        hariLembur: num(r.hariLembur), totalLembur: num(r.totalLembur), insentif: num(r.insentif),
        tambahan: num(r.tambahan), bonusDisiplin: num(r.bonusDisiplin), komisiArloji: num(r.komisiArloji),
        komisiReparasi: num(r.komisiReparasi), thr: num(r.thr), potonganHutang: num(r.potonganHutang),
        bpjs: num(r.bpjs), bayarMess: num(r.bayarMess), pph21: num(r.pph21),
        totalPenerimaan: num(r.totalPenerimaan), totalPotongan: num(r.totalPotongan), gajiTransfer: num(r.gajiTransfer),
      });
    }

    const insH = d.prepare(`INSERT INTO hutang (id,karyawanId,tanggal,keterangan,kasbon,pelunasan,saldoBerjalan,periodeId,createdAt)
      VALUES (@id,@karyawanId,@tanggal,@keterangan,@kasbon,@pelunasan,@saldoBerjalan,@periodeId,@createdAt)`);
    for (const h of s.hutang ?? []) {
      insH.run({
        id: h.id, karyawanId: num(h.karyawanId), tanggal: txt(h.tanggal), keterangan: txt(h.keterangan),
        kasbon: num(h.kasbon), pelunasan: num(h.pelunasan), saldoBerjalan: num(h.saldoBerjalan),
        periodeId: h.periodeId == null ? null : num(h.periodeId), createdAt: txt(h.createdAt),
      });
    }

    const meta = d.prepare("INSERT INTO app_meta (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    meta.run("backups", JSON.stringify(s.backups ?? []));
    meta.run("lastBackupAt", txt(s.lastBackupAt) ?? "");
    meta.run("version", String(parsed.version ?? 1));
    meta.run("savedAt", String(Date.now()));
  });
  tx();
}

/** Reconstruct the zustand-persist JSON string, or null if never saved. */
function loadState() {
  const d = open(currentDir);
  const versionRow = d.prepare("SELECT value FROM app_meta WHERE key='version'").get();
  if (!versionRow) return null; // fresh DB → let the app seed itself

  const karyawan = d.prepare("SELECT * FROM karyawan ORDER BY id").all().map((k) => ({
    id: k.id, nik: k.nik, nama: k.nama, jabatan: k.jabatan, divisi: k.divisi,
    noRekening: k.noRekening, namaPenerima: k.namaPenerima, bank: k.bank,
    tanggalMasuk: k.tanggalMasuk, aktif: !!k.aktif, createdAt: k.createdAt,
    komponen: {
      gajiPokok: k.gajiPokok, transportasi: k.transportasi, rateUangMakan: k.rateUangMakan,
      rateLembur: k.rateLembur, bpjs: k.bpjs, bayarMess: k.bayarMess,
    },
  }));
  const periode = d.prepare("SELECT * FROM periode ORDER BY id").all().map((p) => ({
    id: p.id, bulan: p.bulan, tahun: p.tahun, status: p.status, createdAt: p.createdAt, lockedAt: p.lockedAt,
  }));
  const details = d.prepare("SELECT * FROM payroll_detail").all();
  const hutang = d.prepare("SELECT * FROM hutang ORDER BY id").all().map((h) => ({
    ...h, periodeId: h.periodeId == null ? null : h.periodeId,
  }));

  const backupsRow = d.prepare("SELECT value FROM app_meta WHERE key='backups'").get();
  const lastRow = d.prepare("SELECT value FROM app_meta WHERE key='lastBackupAt'").get();
  let backups = [];
  try {
    backups = JSON.parse(backupsRow?.value ?? "[]");
  } catch {
    backups = [];
  }

  return JSON.stringify({
    state: { karyawan, periode, details, hutang, backups, lastBackupAt: lastRow?.value || new Date().toISOString() },
    version: Number(versionRow.value) || 1,
  });
}

function clearState() {
  const d = open(currentDir);
  d.exec("DELETE FROM karyawan; DELETE FROM periode; DELETE FROM payroll_detail; DELETE FROM hutang; DELETE FROM app_meta;");
}

let currentDir = ".";
function init(userDataDir) {
  currentDir = userDataDir;
  open(userDataDir);
}

module.exports = { init, loadState, saveState, clearState };
