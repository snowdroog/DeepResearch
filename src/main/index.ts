import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './database/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
  })

  // Development vs Production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(() => {
  // Initialize database
  try {
    db.initialize()
    console.log('[App] Database initialized successfully')

    // Log database stats
    const stats = db.getStats()
    console.log('[App] Database stats:', stats)
  } catch (error) {
    console.error('[App] Failed to initialize database:', error)
    app.quit()
    return
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Close database connection
  db.close()
  console.log('[App] Application shutting down')
})
