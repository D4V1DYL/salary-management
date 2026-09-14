// Electron main process. Plain CommonJS on purpose — the most
// battle-tested module format for Electron's main process, independent of
// the frontend package's ESM "type": "module" setting.
const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { APP_SALT, TRIAL_DAYS, normalizeKey, deriveLicenseKey } = require("./license-config.cjs");

/**
 * Licensing + device-lock.
 *
 *   fingerprint = SHA-256(machine_guid | hostname | salt)
 *   deviceCode  = first 24 hex of the fingerprint, grouped (shown to user)
 *   activation  = HMAC(secret, deviceCode)  → the key DM Tech hands out
 *
 * Model:
 *   - First run  → a 14-day TRIAL starts (data never deleted when it ends).
 *   - Trial ends → app locks until a valid activation key is entered.
 *   - A valid key → FULL license, bound to THIS machine's fingerprint.
 *   - Copy the installed app to another PC → fingerprint differs → the
 *     stored key no longer validates → locked there → needs a new key
 *     (the "transfer license" path).
 *
 * Not unbreakable (a determined attacker who unpacks the app can read the
 * salt/secret) — it stops casual copying and enforces the trial window.
 */
const CLOCK_TOLERANCE_MS = 5 * 60 * 1000; // allow 5 min of backward clock drift

function machineGuid() {
  if (process.platform !== "win32") return "unknown-machine";
  try {
    const out = execFileSync(
      "reg",
      ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"],
      { encoding: "utf8", windowsHide: true }
    );
    const match = out.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/);
    return match ? match[1].trim() : "unknown-machine";
  } catch {
    return "unknown-machine";
  }
}

function hostname() {
  try {
    return os.hostname() || "unknown-host";
  } catch {
    return "unknown-host";
  }
}

function computeFingerprint() {
  const guid = machineGuid();
  const host = hostname();
  const raw = `${guid}|${host}|${APP_SALT}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const short = (hash.slice(0, 24).match(/.{1,4}/g) || [])
    .join(" ")
    .toUpperCase();
  return { hash, short, machineGuid: guid, hostname: host };
}

function licensePath() {
  const dir = app.getPath("userData");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "license.lock");
}

function readMarker() {
  const p = licensePath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function writeMarker(marker) {
  fs.writeFileSync(licensePath(), JSON.stringify(marker, null, 2), "utf8");
  return marker;
}

/** Read the marker, creating a fresh trial one on first run. */
function ensureMarker() {
  let m = readMarker();
  if (!m || typeof m !== "object") {
    const now = String(Date.now());
    m = {
      plan: "trial",
      trialStartedAt: now,
      lastSeen: now,
      activatedAt: null,
      fingerprint: null,
      licenseKey: null,
    };
    writeMarker(m);
  }
  return m;
}

/**
 * The one function that decides what state the app is in. Also advances an
 * anti-tamper "lastSeen" watermark so turning the clock back can't extend
 * the trial.
 *
 * state: "trial" | "trial-expired" | "full" | "invalid"
 */
function computeStatus() {
  const fp = computeFingerprint();
  const m = ensureMarker();
  const now = Date.now();
  const lastSeen = Number(m.lastSeen) || now;
  const clockRolledBack = now < lastSeen - CLOCK_TOLERANCE_MS;

  let state;
  let daysLeft = 0;

  if (m.plan === "full") {
    const expected = deriveLicenseKey(fp.short);
    state = normalizeKey(m.licenseKey) === normalizeKey(expected) ? "full" : "invalid";
  } else {
    const start = Number(m.trialStartedAt) || now;
    const elapsedDays = (now - start) / 86_400_000;
    daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - elapsedDays));
    // Clock tampering ends the trial immediately.
    state = daysLeft > 0 && !clockRolledBack ? "trial" : "trial-expired";
  }

  // Advance the watermark (never let it go backwards).
  m.lastSeen = String(Math.max(now, lastSeen));
  writeMarker(m);

  return {
    plan: m.plan,
    state,
    daysLeft,
    trialDays: TRIAL_DAYS,
    fingerprint: fp,
    activatedAt: m.activatedAt || null,
  };
}

/** Validate an activation key and, if it matches this device, go full. */
function activateKey(key) {
  const fp = computeFingerprint();
  const expected = deriveLicenseKey(fp.short);
  if (normalizeKey(key) !== normalizeKey(expected)) {
    throw new Error("Kode aktivasi tidak valid untuk perangkat ini.");
  }
  const m = ensureMarker();
  m.plan = "full";
  m.fingerprint = fp.hash;
  m.licenseKey = expected;
  m.activatedAt = String(Date.now());
  writeMarker(m);
  return computeStatus();
}

ipcMain.handle("license:fingerprint", () => computeFingerprint());
ipcMain.handle("license:status", () => computeStatus());
ipcMain.handle("license:activate-key", (_event, key) => activateKey(key));

/* ------------------------------------------------------------------ *
 * Backup — real files this time, under the user's Documents folder.
 * ------------------------------------------------------------------ */
const MAX_BACKUPS = 30;

function backupDir() {
  const dir = path.join(app.getPath("documents"), "PayrollApp", "backups");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function backupStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 13); // YYYYMMDD-HHmm
}

function pruneBackups(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("payroll-") && f.endsWith(".json"))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { f } of files.slice(MAX_BACKUPS)) {
    try {
      fs.unlinkSync(path.join(dir, f));
    } catch {
      /* best-effort cleanup */
    }
  }
}

function writeBackupFile(jsonString, trigger) {
  const dir = backupDir();
  const safeTrigger = String(trigger || "manual").replace(/[^a-z-]/gi, "") || "manual";
  const fileName = `payroll-${backupStamp(new Date())}-${safeTrigger}.json`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, jsonString ?? "", "utf8");
  const stat = fs.statSync(filePath);
  pruneBackups(dir);
  return {
    id: fileName,
    createdAt: String(stat.mtimeMs),
    trigger: safeTrigger,
    sizeKb: Math.max(1, Math.round(stat.size / 1024)),
    path: filePath,
  };
}

function listBackupFiles() {
  const dir = backupDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("payroll-") && f.endsWith(".json"))
    .map((f) => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      const m = f.match(/^payroll-\d{8}-\d{4}-([a-z-]+)\.json$/i);
      return {
        id: f,
        createdAt: String(stat.mtimeMs),
        trigger: m ? m[1] : "manual",
        sizeKb: Math.max(1, Math.round(stat.size / 1024)),
        path: full,
      };
    })
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
}

ipcMain.handle("backup:write", (_event, jsonString, trigger) => writeBackupFile(jsonString, trigger));
ipcMain.handle("backup:list", () => listBackupFiles());
ipcMain.handle("backup:open-folder", () => shell.openPath(backupDir()));

// Restore: let the user pick a backup file and return its raw contents so the
// renderer can load it into the store. Returns null if the dialog is cancelled.
ipcMain.handle("backup:pick-restore", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Pilih file backup untuk dipulihkan",
    defaultPath: backupDir(),
    filters: [{ name: "Backup Payroll", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (canceled || !filePaths[0]) return null;
  const content = fs.readFileSync(filePaths[0], "utf8");
  return { path: filePaths[0], content };
});

/* ------------------------------------------------------------------ *
 * Generic "save a file" — used by the CSV export (Rekap Hutang) etc.
 * ------------------------------------------------------------------ */
ipcMain.handle("file:save-text", async (event, defaultName, content) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const ext = (String(defaultName).split(".").pop() || "txt").toLowerCase();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Simpan file",
    defaultPath: path.join(app.getPath("documents"), defaultName),
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  if (canceled || !filePath) return null;
  // BOM so Excel opens UTF-8 CSV with correct accents.
  const body = ext === "csv" ? "﻿" + content : content;
  fs.writeFileSync(filePath, body, "utf8");
  return filePath;
});

/* ------------------------------------------------------------------ *
 * Real PDF export — renders the current page (with its print CSS) to a
 * PDF file the user chooses. Used by Slip Gaji.
 * ------------------------------------------------------------------ */
ipcMain.handle("pdf:save", async (event, defaultName) => {
  const wc = event.sender;
  const win = BrowserWindow.fromWebContents(wc);
  const data = await wc.printToPDF({
    printBackground: true,
    pageSize: "A4",
    margins: { marginType: "custom", top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
  });
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Simpan slip gaji sebagai PDF",
    defaultPath: path.join(app.getPath("documents"), defaultName),
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return null;
  fs.writeFileSync(filePath, data);
  return filePath;
});

/* ------------------------------------------------------------------ */

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 1024,
    minHeight: 700,
    title: "DM Tech Payroll",
    icon: path.join(__dirname, "..", "build", "icon.ico"),
    backgroundColor: "#fcfcfc",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Ask the renderer for its current data before actually closing, so we
  // can flush one last backup. Falls through to a normal close if the page
  // never answers (e.g. it crashed) so the app is never un-closable.
  let closeDataReceived = false;
  win.on("close", (event) => {
    if (closeDataReceived) return; // second pass, from win.close() below — let it through
    event.preventDefault();
    const finish = (jsonString) => {
      if (closeDataReceived) return;
      closeDataReceived = true;
      if (jsonString) {
        try {
          writeBackupFile(jsonString, "auto-close");
        } catch {
          /* best-effort — never block the app from closing over this */
        }
      }
      win.close();
    };
    const timeout = setTimeout(() => finish(null), 1500);
    ipcMain.once("app:close-data", (_event, jsonString) => {
      clearTimeout(timeout);
      finish(jsonString);
    });
    win.webContents.send("app:request-close-data");
  });

  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Any target="_blank" / window.open goes to the system browser, never a
  // second app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
