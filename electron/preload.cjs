const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  deviceFingerprint: () => ipcRenderer.invoke("license:fingerprint"),
  licenseStatus: () => ipcRenderer.invoke("license:status"),
  activateLicenseKey: (key) => ipcRenderer.invoke("license:activate-key", key),

  writeBackup: (json, trigger) => ipcRenderer.invoke("backup:write", json, trigger),
  listBackups: () => ipcRenderer.invoke("backup:list"),
  openBackupFolder: () => ipcRenderer.invoke("backup:open-folder"),
  pickRestoreBackup: () => ipcRenderer.invoke("backup:pick-restore"),

  saveTextFile: (defaultName, content) => ipcRenderer.invoke("file:save-text", defaultName, content),
  savePdf: (defaultName) => ipcRenderer.invoke("pdf:save", defaultName),

  onRequestCloseData: (handler) => ipcRenderer.on("app:request-close-data", () => handler()),
  sendCloseData: (json) => ipcRenderer.send("app:close-data", json),
});
