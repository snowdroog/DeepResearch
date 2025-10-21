import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { db } from './database/db.js'
import { SessionManager } from './session/SessionManager.js'
import { createUpdater } from './updater/AutoUpdater.js'

// Define __filename and __dirname for ES modules and make them global for dependencies
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Make available globally for bundled dependencies that expect them
;(global as any).__filename = __filename
;(global as any).__dirname = __dirname

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
      sandbox: false, // Must be false for preload scripts to have access to require()
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

  // Load persisted sessions (skip in test mode to avoid BrowserView interference)
  if (process.env.SKIP_SESSION_RESTORE !== '1') {
    sessionManager.loadPersistedSessions().catch(error => {
      console.error('[App] Failed to load persisted sessions:', error)
    })
  } else {
    console.log('[App] Skipping session restore (test mode)')
  }

  // Register IPC handlers
  registerIpcHandlers()

  // Initialize auto-updater (only in production)
  if (process.env.NODE_ENV !== 'development') {
    const updater = createUpdater({
      autoDownload: true,
      autoInstallOnAppQuit: true,
      checkOnStartup: true,
      checkInterval: 4 * 60 * 60 * 1000, // Check every 4 hours
      allowPrerelease: false,
    })
    updater.setMainWindow(window)
    updater.start()
    console.log('[App] Auto-updater initialized')
  }

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

  // View: Update bounds
  ipcMain.handle('view:updateBounds', async (_event, sessionId: string, bounds: { x: number; y: number; width: number; height: number }) => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      console.log(`[IPC] view:updateBounds called for session ${sessionId}`, bounds)

      const view = sessionManager.getView(sessionId)
      if (!view) {
        console.error(`[IPC] View not found for session ${sessionId}`)
        return { success: false, error: 'View not found' }
      }

      view.setBounds(bounds)
      console.log(`[IPC] View bounds updated for session ${sessionId}`)
      return { success: true }
    } catch (error) {
      console.error('[IPC] view:updateBounds error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // View: Set visible
  ipcMain.handle('view:setVisible', async (_event, sessionId: string, visible: boolean) => {
    try {
      if (!sessionManager) throw new Error('SessionManager not initialized')
      console.log(`[IPC] view:setVisible called for session ${sessionId}, visible: ${visible}`)

      const view = sessionManager.getView(sessionId)
      if (!view) {
        console.error(`[IPC] View not found for session ${sessionId}`)
        return { success: false, error: 'View not found' }
      }

      if (visible) {
        // Add view to window if not already added
        if (!mainWindow) throw new Error('Main window not available')
        const childViews = mainWindow.contentView.children
        if (!childViews.includes(view)) {
          mainWindow.contentView.addChildView(view)
          console.log(`[IPC] View added to window for session ${sessionId}`)
        }
        view.setVisible(true)
      } else {
        view.setVisible(false)
      }

      console.log(`[IPC] View visibility updated for session ${sessionId}`)
      return { success: true }
    } catch (error) {
      console.error('[IPC] view:setVisible error:', error)
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

  // Export: Show save dialog
  ipcMain.handle('export:showSaveDialog', async (_event, options: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => {
    try {
      if (!mainWindow) throw new Error('Main window not available')

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Research Data',
        defaultPath: options.defaultPath,
        filters: options.filters || [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      return { success: true, filePath: result.filePath, canceled: result.canceled }
    } catch (error) {
      console.error('[IPC] export:showSaveDialog error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Export: Write JSON (non-streaming)
  ipcMain.handle('export:writeJson', async (_event, filePath: string, data: any) => {
    try {
      const jsonContent = JSON.stringify(data, null, 2)
      fs.writeFileSync(filePath, jsonContent, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('[IPC] export:writeJson error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Export: Write JSON with streaming and progress updates
  ipcMain.handle('export:writeJsonStream', async (event, filePath: string, filters: any = {}) => {
    try {
      const captures = db.getCaptures(filters)
      const totalRecords = captures.length

      // Open file stream
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' })

      // Write opening bracket
      writeStream.write('[\n')

      let processed = 0
      for (let i = 0; i < captures.length; i++) {
        const capture = captures[i]
        const json = JSON.stringify(capture, null, 2)

        // Indent the JSON object
        const indentedJson = json.split('\n').map(line => '  ' + line).join('\n')

        if (i > 0) {
          writeStream.write(',\n')
        }
        writeStream.write(indentedJson)

        processed++

        // Send progress update every 100 records or on last record
        if (processed % 100 === 0 || processed === totalRecords) {
          event.sender.send('export:progress', {
            processed,
            total: totalRecords,
            percentage: Math.round((processed / totalRecords) * 100)
          })
        }
      }

      // Write closing bracket
      writeStream.write('\n]')
      writeStream.end()

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve())
        writeStream.on('error', reject)
      })

      return { success: true, recordsExported: totalRecords }
    } catch (error) {
      console.error('[IPC] export:writeJsonStream error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // Export: Write CSV with streaming and progress updates
  ipcMain.handle('export:writeCsv', async (event, filePath: string, filters: any = {}) => {
    try {
      const captures = db.getCaptures(filters)
      const totalRecords = captures.length

      if (totalRecords === 0) {
        return { success: false, error: 'No records to export' }
      }

      // Open file stream
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' })

      // CSV Helper function to escape fields
      const escapeCsvField = (field: any): string => {
        if (field === null || field === undefined) return ''
        const str = String(field)
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      // Write CSV header
      const headers = [
        'id',
        'session_id',
        'provider',
        'prompt',
        'response',
        'response_format',
        'model',
        'timestamp',
        'token_count',
        'tags',
        'notes',
        'is_archived'
      ]
      writeStream.write(headers.join(',') + '\n')

      // Write CSV rows
      let processed = 0
      for (const capture of captures) {
        const row = [
          escapeCsvField(capture.id),
          escapeCsvField(capture.session_id),
          escapeCsvField(capture.provider),
          escapeCsvField(capture.prompt),
          escapeCsvField(capture.response),
          escapeCsvField(capture.response_format),
          escapeCsvField(capture.model),
          escapeCsvField(capture.timestamp),
          escapeCsvField(capture.token_count),
          escapeCsvField(capture.tags),
          escapeCsvField(capture.notes),
          escapeCsvField(capture.is_archived)
        ]
        writeStream.write(row.join(',') + '\n')

        processed++

        // Send progress update every 100 records or on last record
        if (processed % 100 === 0 || processed === totalRecords) {
          event.sender.send('export:progress', {
            processed,
            total: totalRecords,
            percentage: Math.round((processed / totalRecords) * 100)
          })
        }
      }

      writeStream.end()

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve())
        writeStream.on('error', reject)
      })

      return { success: true, recordsExported: totalRecords }
    } catch (error) {
      console.error('[IPC] export:writeCsv error:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // ==================== TEST-ONLY IPC HANDLERS ====================
  // These handlers are only available in test/development mode to help with E2E testing
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    // Test: Create capture
    ipcMain.handle('test:createCapture', async (_event, captureData: {
      id: string
      session_id: string
      provider: string
      prompt: string
      response: string
      model?: string
      tags?: string
      notes?: string
      token_count?: number
      response_format?: string
    }) => {
      try {
        const capture = db.createCapture(captureData)
        return { success: true, capture }
      } catch (error) {
        console.error('[IPC] test:createCapture error:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // Test: Create session
    ipcMain.handle('test:createSession', async (_event, sessionData: {
      id: string
      provider: string
      name: string
      partition?: string
    }) => {
      try {
        const session = db.createSession({
          ...sessionData,
          partition: sessionData.partition || `persist:${sessionData.provider}`,
        })
        return { success: true, session }
      } catch (error) {
        console.error('[IPC] test:createSession error:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // Test: Clear all captures
    ipcMain.handle('test:clearCaptures', async () => {
      try {
        const dbInstance = db.getDb()
        dbInstance.prepare('DELETE FROM captures').run()
        return { success: true }
      } catch (error) {
        console.error('[IPC] test:clearCaptures error:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // Test: Clear all sessions
    ipcMain.handle('test:clearSessions', async () => {
      try {
        const dbInstance = db.getDb()
        dbInstance.prepare('DELETE FROM sessions').run()
        return { success: true }
      } catch (error) {
        console.error('[IPC] test:clearSessions error:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    // Test: Get all sessions
    ipcMain.handle('test:getSessions', async () => {
      try {
        const sessions = db.getSessions(true)
        return { success: true, data: sessions }
      } catch (error) {
        console.error('[IPC] test:getSessions error:', error)
        return { success: false, error: (error as Error).message }
      }
    })

    console.log('[IPC] Test handlers registered (test/development mode)')
  }

  console.log('[IPC] Handlers registered successfully')
}
