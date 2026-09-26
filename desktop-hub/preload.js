const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('hub', {
  providers: () => ipcRenderer.invoke('providers'),
  npmAvailable: () => ipcRenderer.invoke('npmAvailable'),
  setProviderPath: (id, file) => ipcRenderer.invoke('providers:setPath', id, file),
  addCustomProvider: (c) => ipcRenderer.invoke('providers:addCustom', c),
  removeCustomProvider: (id) => ipcRenderer.invoke('providers:removeCustom', id),
  commands: (provider) => ipcRenderer.invoke('commands', provider),
  limits: (provider) => ipcRenderer.invoke('limits', provider),
  chats: {
    list: () => ipcRenderer.invoke('chats:list'),
    load: (id) => ipcRenderer.invoke('chats:load', id),
    save: (chat) => ipcRenderer.invoke('chats:save', chat),
    remove: (id) => ipcRenderer.invoke('chats:delete', id),
  },
  pickFolder: (current) => ipcRenderer.invoke('pickFolder', current),
  pickFile: (current) => ipcRenderer.invoke('pickFile', current),
  pickFiles: (current) => ipcRenderer.invoke('pickFiles', current),
  // Real disk path of a dropped File (File.path is deprecated in newer Electron).
  pathForFile: (file) => (webUtils && webUtils.getPathForFile ? webUtils.getPathForFile(file) : file.path),
  home: () => ipcRenderer.invoke('home'),
  openExternal: (url) => ipcRenderer.send('openExternal', url),
  send: (msg) => ipcRenderer.send('send', msg),
  stop: () => ipcRenderer.send('stop'),
  onEvent: (fn) => ipcRenderer.on('ev', (_e, ev) => fn(ev)),
  onDone: (fn) => ipcRenderer.on('done', (_e, c) => fn(c)),
});
