import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { db } from './database/db.js'
import { SessionManager } from './session/SessionManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let sessionManager: SessionManager | null = null

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

  mainWindow.on('closed', async () => {
    // Clean up session manager
    if (sessionManager) {
      await sessionManager.destroy()
      sessionManager = null
    }
    mainWindow = null
  })

  return mainWindow
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

  const window = createWindow()

  // Initialize session manager
  sessionManager = new SessionManager(window)

  // Load persisted sessions
  sessionManager.loadPersistedSessions().catch(error => {
    console.error('[App] Failed to load persisted sessions:', error)
  })

  // Register IPC handlers
  registerIpcHandlers()

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

app.on('before-quit', async () => {
  // Clean up session manager
  if (sessionManager) {
    await sessionManager.destroy()
  }

  // Close database connection
  db.close()
  console.log('[App] Application shutting down')
})

// ==================== IPC HANDLERS ====================

function registerIpcHandlers() {
  // Session: Create
  ipcMain.handle('session:create', async (_event, config) => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      const session = await sessionManager.createSession(config)
      return { success: true, session }
    } catch (error) {
      console.error('[IPC] session:create error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Session: Activate
  ipcMain.handle('session:activate', async (_event, sessionId: string) => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      const success = sessionManager.activateSession(sessionId)
      return { success }
    } catch (error) {
      console.error('[IPC] session:activate error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Session: Delete
  ipcMain.handle('session:delete', async (_event, sessionId: string) => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      const success = sessionManager.deleteSession(sessionId)
      return { success }
    } catch (error) {
      console.error('[IPC] session:delete error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Session: List
  ipcMain.handle('session:list', async (_event, includeInactive = false) => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      const sessions = sessionManager.listSessions(includeInactive)
      return { success: true, sessions }
    } catch (error) {
      console.error('[IPC] session:list error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Session: Get active
  ipcMain.handle('session:getActive', async () => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      const activeSessionId = sessionManager.getActiveSessionId()
      return { success: true, activeSessionId }
    } catch (error) {
      console.error('[IPC] session:getActive error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Get captures
  ipcMain.handle('data:getCaptures', async (_event, filters = {}) => {
    try {
      const captures = db.getCaptures(filters)
      return { success: true, captures }
    } catch (error) {
      console.error('[IPC] data:getCaptures error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Get capture by ID
  ipcMain.handle('data:getCapture', async (_event, captureId: string) => {
    try {
      const capture = db.getCapture(captureId)
      if (!capture) {
        return { success: false, error: 'Capture not found' }
      }
      return { success: true, capture }
    } catch (error) {
      console.error('[IPC] data:getCapture error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Search captures
  ipcMain.handle('data:searchCaptures', async (_event, query: string, filters = {}) => {
    try {
      const captures = db.searchCaptures(query, filters)
      return { success: true, captures }
    } catch (error) {
      console.error('[IPC] data:searchCaptures error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Update capture tags
  ipcMain.handle('data:updateTags', async (_event, captureId: string, tags: string[]) => {
    try {
      db.updateCaptureTags(captureId, tags)
      return { success: true }
    } catch (error) {
      console.error('[IPC] data:updateTags error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Update capture notes
  ipcMain.handle('data:updateNotes', async (_event, captureId: string, notes: string) => {
    try {
      db.updateCaptureNotes(captureId, notes)
      return { success: true }
    } catch (error) {
      console.error('[IPC] data:updateNotes error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Archive/unarchive capture
  ipcMain.handle('data:setArchived', async (_event, captureId: string, isArchived: boolean) => {
    try {
      db.setCaptureArchived(captureId, isArchived)
      return { success: true }
    } catch (error) {
      console.error('[IPC] data:setArchived error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Delete capture
  ipcMain.handle('data:deleteCapture', async (_event, captureId: string) => {
    try {
      db.deleteCapture(captureId)
      return { success: true }
    } catch (error) {
      console.error('[IPC] data:deleteCapture error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Data: Get database stats
  ipcMain.handle('data:getStats', async () => {
    try {
      const stats = db.getStats()
      return { success: true, stats }
    } catch (error) {
      console.error('[IPC] data:getStats error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  console.log('[IPC] Handlers registered successfully')
}
