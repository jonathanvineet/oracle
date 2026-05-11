const { contextBridge, ipcRenderer } = require('electron')
const keytar = require('keytar')

const SERVICE = 'oracle-wodget'
const ACCOUNT_TOKEN = 'auth-token'
const ACCOUNT_SERVER = 'server-url'

contextBridge.exposeInMainWorld('electronAPI', {
  setToken: async (token) => keytar.setPassword(SERVICE, ACCOUNT_TOKEN, token),
  getToken: async () => keytar.getPassword(SERVICE, ACCOUNT_TOKEN),
  clearToken: async () => keytar.deletePassword(SERVICE, ACCOUNT_TOKEN),
  setServer: async (url) => keytar.setPassword(SERVICE, ACCOUNT_SERVER, url),
  getServer: async () => keytar.getPassword(SERVICE, ACCOUNT_SERVER),
  setAlwaysOnTop: (val) => ipcRenderer.invoke('set-always-on-top', val)
})
