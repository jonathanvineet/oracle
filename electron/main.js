const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')
const isMac = process.platform === 'darwin'

let mainWindow
let tray
let alwaysOnTop = true

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    transparent: true,
    resizable: true,
    vibrancy: isMac ? 'ultra-dark' : undefined,
    alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  mainWindow.setVisibleOnAllWorkspaces(true)
}

app.whenReady().then(() => {
  createWindow()
  const iconPath = path.join(__dirname, 'renderer', 'icon.png')
  const image = nativeImage.createFromPath(iconPath)
  tray = new Tray(image)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Toggle Always On Top', click: () => { alwaysOnTop = !alwaysOnTop; mainWindow.setAlwaysOnTop(alwaysOnTop) } },
    { type: 'separator' },
    { role: 'quit' }
  ])
  tray.setToolTip('WODGET EVERYTHING ORACLE')
  tray.setContextMenu(contextMenu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

ipcMain.handle('set-always-on-top', (ev, val) => {
  alwaysOnTop = !!val
  if (mainWindow) mainWindow.setAlwaysOnTop(alwaysOnTop)
  return alwaysOnTop
})
