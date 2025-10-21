export interface AppSettings {
  // General Settings
  general: {
    autoSave: boolean
    saveInterval: number // in seconds
    enableNotifications: boolean
    startMinimized: boolean
    closeToTray: boolean
  }

  // UI Preferences
  ui: {
    theme: 'light' | 'dark' | 'system'
    fontSize: 'small' | 'medium' | 'large'
    sidebarPosition: 'left' | 'right'
    compactMode: boolean
    showTimestamps: boolean
  }

  // Export Settings
  export: {
    defaultFormat: 'json' | 'markdown' | 'csv' | 'html'
    includeMetadata: boolean
    includeAttachments: boolean
    exportPath: string
    autoExportOnCapture: boolean
  }

  // Capture Settings
  capture: {
    autoCapture: boolean
    captureDelay: number // in milliseconds
    maxRetries: number
    enableScreenshots: boolean
    screenshotQuality: number // 0-100
    captureProviders: {
      chatgpt: boolean
      claude: boolean
      gemini: boolean
      perplexity: boolean
      custom: boolean
    }
  }

  // Database Settings
  database: {
    autoBackup: boolean
    backupInterval: number // in hours
    backupRetention: number // in days
    maxBackupSize: number // in MB
    backupPath: string
    enableCompression: boolean
  }

  // Advanced Settings
  advanced: {
    enableLogging: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
    maxLogSize: number // in MB
    enableAnalytics: boolean
    checkForUpdates: boolean
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    autoSave: true,
    saveInterval: 30,
    enableNotifications: true,
    startMinimized: false,
    closeToTray: false,
  },
  ui: {
    theme: 'system',
    fontSize: 'medium',
    sidebarPosition: 'left',
    compactMode: false,
    showTimestamps: true,
  },
  export: {
    defaultFormat: 'json',
    includeMetadata: true,
    includeAttachments: true,
    exportPath: '',
    autoExportOnCapture: false,
  },
  capture: {
    autoCapture: true,
    captureDelay: 1000,
    maxRetries: 3,
    enableScreenshots: true,
    screenshotQuality: 80,
    captureProviders: {
      chatgpt: true,
      claude: true,
      gemini: true,
      perplexity: true,
      custom: false,
    },
  },
  database: {
    autoBackup: true,
    backupInterval: 24,
    backupRetention: 30,
    maxBackupSize: 100,
    backupPath: '',
    enableCompression: true,
  },
  advanced: {
    enableLogging: true,
    logLevel: 'info',
    maxLogSize: 50,
    enableAnalytics: false,
    checkForUpdates: true,
  },
}
