const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('hub', {
  providers: () => ipcRenderer.invoke('providers'),
  send: (msg) => ipcRenderer.send('send', msg),
  stop: () => ipcRenderer.send('stop'),
  onChunk: (fn) => ipcRenderer.on('chunk', (_e, t) => fn(t)),
  onDone: (fn) => ipcRenderer.on('done', (_e, c) => fn(c)),
});
