import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./styles/globals.css";

import App from "./App";
import { applyStoredTheme } from "./lib/theme";
import { appTitle } from "./config/brand";
import { inElectron } from "./lib/electron";
import { snapshotJSON } from "./data/store";

/**
 * A blank white window with no error is the single worst failure mode for a
 * packaged desktop app — there is no console to open on a client's machine.
 * If mounting throws (or something crashes before first paint), replace the
 * blank page with a plain-DOM message instead of leaving it silent.
 */
function showFatalError(err: unknown) {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const stack = err instanceof Error && err.stack ? err.stack : "";
  document.body.innerHTML = `
    <div style="font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:20px;color:#171717">
      <h1 style="font-size:16px;margin:0 0 8px;color:#c02535">DM Tech Payroll gagal dimuat</h1>
      <p style="font-size:13px;color:#525252;line-height:1.5">
        Terjadi error saat memuat aplikasi. Kirim screenshot ini ke admin/pengembang.
      </p>
      <pre style="white-space:pre-wrap;font-size:11px;background:#f5f5f5;border:1px solid #e5e5e5;border-radius:8px;padding:12px;color:#404040;overflow:auto">${escapeHtml(message)}${stack ? "\n\n" + escapeHtml(stack) : ""}</pre>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

window.addEventListener("error", (e) => showFatalError(e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => showFatalError(e.reason));

try {
  applyStoredTheme();
  document.title = appTitle;

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error('Elemen #root tidak ditemukan di index.html.');

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
} catch (err) {
  showFatalError(err);
}

// On close, hand the current data to the main process so it can flush a
// final SQLite save + an auto-backup before the window goes away.
if (inElectron()) {
  window.electronAPI!.onRequestCloseData(() => {
    window.electronAPI!.sendCloseData(snapshotJSON());
  });
}
