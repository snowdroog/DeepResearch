import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import log from 'electron-log'

/**
 * AutoUpdater - Manages automatic updates using electron-updater
 *
 * Features:
 * - Automatic update checks on startup
 * - Background download of updates
 * - User notification and confirmation before install
 * - Configurable update channel (stable, beta, alpha)
 * - Auto-restart on update install (with user confirmation)
 */

export interface UpdaterConfig {
  autoDownload?: boolean      // Auto-download updates when available (default: true)
  autoInstallOnAppQuit?: boolean  // Auto-install on app quit (default: true)
  checkOnStartup?: boolean    // Check for updates on app startup (default: true)
  checkInterval?: number      // Check interval in milliseconds (default: 4 hours)
  allowPrerelease?: boolean   // Allow beta/alpha versions (default: false)
  allowDowngrade?: boolean    // Allow downgrade to older versions (default: false)
}

export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
  downloadSize?: number
}

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null
  private checkInterval: NodeJS.Timeout | null = null
  private config: Required<UpdaterConfig>

  constructor(config: UpdaterConfig = {}) {
    // Default configuration
    this.config = {
      autoDownload: config.autoDownload ?? true,
      autoInstallOnAppQuit: config.autoInstallOnAppQuit ?? true,
      checkOnStartup: config.checkOnStartup ?? true,
      checkInterval: config.checkInterval ?? 4 * 60 * 60 * 1000, // 4 hours
      allowPrerelease: config.allowPrerelease ?? false,
      allowDowngrade: config.allowDowngrade ?? false,
    }

    // Configure electron-updater logger
    autoUpdater.logger = log
    log.transports.file.level = 'info'

    // Configure autoUpdater settings
    autoUpdater.autoDownload = this.config.autoDownload
    autoUpdater.autoInstallOnAppQuit = this.config.autoInstallOnAppQuit
    autoUpdater.allowPrerelease = this.config.allowPrerelease
    autoUpdater.allowDowngrade = this.config.allowDowngrade

    // Set up event listeners
    this.setupEventListeners()
  }

  /**
   * Set the main window reference for dialog notifications
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Start auto-update checks
   */
  start(): void {
    // Initial check on startup
    if (this.config.checkOnStartup) {
      // Delay first check by 10 seconds to let app fully load
      setTimeout(() => {
        this.checkForUpdates()
      }, 10000)
    }

    // Set up periodic checks
    if (this.config.checkInterval > 0) {
      this.checkInterval = setInterval(() => {
        this.checkForUpdates()
      }, this.config.checkInterval)
    }

    log.info('[AutoUpdater] Started')
  }

  /**
   * Stop auto-update checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    log.info('[AutoUpdater] Stopped')
  }

  /**
   * Manually trigger update check
   */
  async checkForUpdates(): Promise<void> {
    try {
      log.info('[AutoUpdater] Checking for updates...')
      const updateCheck = await autoUpdater.checkForUpdates()

      if (updateCheck?.updateInfo) {
        log.info('[AutoUpdater] Update check result:', {
          currentVersion: autoUpdater.currentVersion.version,
          latestVersion: updateCheck.updateInfo.version,
        })
      }
    } catch (error) {
      log.error('[AutoUpdater] Error checking for updates:', error)
      // Don't show error to user for automatic checks
    }
  }

  /**
   * Download the available update
   */
  async downloadUpdate(): Promise<void> {
    try {
      log.info('[AutoUpdater] Starting update download...')
      await autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('[AutoUpdater] Error downloading update:', error)
      this.showErrorDialog('Failed to download update. Please try again later.')
    }
  }

  /**
   * Install the downloaded update and restart app
   */
  quitAndInstall(): void {
    log.info('[AutoUpdater] Installing update and restarting...')
    autoUpdater.quitAndInstall(false, true)
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return autoUpdater.currentVersion.version
  }

  /**
   * Set up event listeners for update lifecycle
   */
  private setupEventListeners(): void {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('[AutoUpdater] Checking for update...')
    })

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('[AutoUpdater] Update available:', {
        version: info.version,
        releaseDate: info.releaseDate,
      })

      // Notify user
      this.notifyUpdateAvailable({
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      })
    })

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      log.info('[AutoUpdater] No update available. Current version:', info.version)
    })

    // Download progress
    autoUpdater.on('download-progress', (progress) => {
      const logMessage = `Download progress: ${progress.percent.toFixed(2)}% (${progress.transferred}/${progress.total} bytes)`
      log.info(`[AutoUpdater] ${logMessage}`)

      // Send progress to renderer if window exists
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update:download-progress', {
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        })
      }
    })

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('[AutoUpdater] Update downloaded:', {
        version: info.version,
        releaseDate: info.releaseDate,
      })

      // Ask user to install
      this.askToInstallUpdate({
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      })
    })

    // Error occurred
    autoUpdater.on('error', (error) => {
      log.error('[AutoUpdater] Update error:', error)
    })
  }

  /**
   * Notify user that an update is available
   */
  private notifyUpdateAvailable(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    const message = `A new version ${info.version} is available!${info.releaseNotes ? '\n\n' + info.releaseNotes : ''}`

    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'DeepResearch Update Available',
      detail: message,
      buttons: this.config.autoDownload ? ['OK'] : ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((response) => {
      if (response.response === 0 && !this.config.autoDownload) {
        this.downloadUpdate()
      }
    })
  }

  /**
   * Ask user to install downloaded update
   */
  private askToInstallUpdate(info: UpdateInfo): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      // If window is closed, just install on next launch
      return
    }

    const message = `Version ${info.version} has been downloaded. Would you like to restart and install it now?`

    dialog.showMessageBox(this.mainWindow, {
      type: 'question',
      title: 'Update Ready',
      message: 'DeepResearch Update Ready',
      detail: message,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then((response) => {
      if (response.response === 0) {
        this.quitAndInstall()
      } else {
        log.info('[AutoUpdater] User postponed update installation')
      }
    })
  }

  /**
   * Show error dialog to user
   */
  private showErrorDialog(message: string): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return

    dialog.showMessageBox(this.mainWindow, {
      type: 'error',
      title: 'Update Error',
      message: 'Update Failed',
      detail: message,
      buttons: ['OK'],
    })
  }
}

// Export singleton instance
let updaterInstance: AutoUpdater | null = null

export function createUpdater(config?: UpdaterConfig): AutoUpdater {
  if (!updaterInstance) {
    updaterInstance = new AutoUpdater(config)
  }
  return updaterInstance
}

export function getUpdater(): AutoUpdater | null {
  return updaterInstance
}
