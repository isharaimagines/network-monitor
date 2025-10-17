const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Python process events
  onPythonOutput: (callback) => ipcRenderer.on("python-output", callback),
  onPythonError: (callback) => ipcRenderer.on("python-error", callback),
  onPythonClosed: (callback) => ipcRenderer.on("python-closed", callback),
  onPythonStopped: (callback) => ipcRenderer.on("python-stopped", callback),
  onPythonRestarted: (callback) => ipcRenderer.on("python-restarted", callback),

  // App control
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
