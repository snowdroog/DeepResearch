/**
 * Global type declarations for renderer process
 * Extends window object with Electron API types
 */

declare global {
  interface Window {
    electronAPI: {
      // Window controls
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void

      // Auth (placeholder for future implementation)
      auth: {
        login: (provider: string) => Promise<any>
        logout: () => Promise<any>
        getSession: () => Promise<any>
      }

      // Session management
      sessions: {
        create: (config: {
          provider: 'claude' | 'openai' | 'gemini' | 'custom'
          name: string
          url?: string
        }) => Promise<any>
        createCaptureSession: (config: {
          captureId: string
          name: string
        }) => Promise<any>
        activate: (sessionId: string) => Promise<any>
        delete: (sessionId: string) => Promise<any>
        list: (includeInactive?: boolean) => Promise<any>
        getActive: () => Promise<any>
        captureCurrentPage: (sessionId: string) => Promise<{ success: boolean; error?: string }>
        onSessionCreated: (callback: (data: { sessionId: string; provider: string; name: string }) => void) => () => void
        onSessionDeleted: (callback: (data: { sessionId: string }) => void) => () => void
      }

      // View management
      views: {
        updateBounds: (
          sessionId: string,
          bounds: { x: number; y: number; width: number; height: number }
        ) => Promise<{ success: boolean; error?: string }>
        setVisible: (
          sessionId: string,
          visible: boolean
        ) => Promise<{ success: boolean; error?: string }>
      }

      // Data operations
      data: {
        getCaptures: (
          filters?: Record<string, unknown>
        ) => Promise<{ success: boolean; captures?: any[]; error?: string }>
        getCapture: (
          captureId: string
        ) => Promise<{ success: boolean; capture?: any; error?: string }>
        searchCaptures: (
          query: string,
          filters?: Record<string, unknown>
        ) => Promise<{ success: boolean; captures?: any[]; error?: string }>
        updateTags: (
          captureId: string,
          tags: string[]
        ) => Promise<{ success: boolean; error?: string }>
        updateNotes: (
          captureId: string,
          notes: string
        ) => Promise<{ success: boolean; error?: string }>
        updateMessageType: (
          captureId: string,
          messageType: 'chat' | 'deep_research' | 'image' | 'code'
        ) => Promise<{ success: boolean; error?: string }>
        updateTopic: (
          captureId: string,
          topic: string | null
        ) => Promise<{ success: boolean; error?: string }>
        updateMetadata: (
          captureId: string,
          metadata: Record<string, any> | null
        ) => Promise<{ success: boolean; error?: string }>
        setArchived: (
          captureId: string,
          isArchived: boolean
        ) => Promise<{ success: boolean; error?: string }>
        deleteCapture: (
          captureId: string
        ) => Promise<{ success: boolean; error?: string }>
        getStats: () => Promise<{
          success: boolean
          stats?: {
            totalSessions: number
            activeSessions: number
            totalCaptures: number
            archivedCaptures: number
            dbSizeBytes: number
          }
          error?: string
        }>
        getAllTags: () => Promise<{ success: boolean; tags?: string[]; error?: string }>
        onCapture: (callback: (data: { captureId: string; sessionId: string; provider: string; preview: string }) => void) => () => void
      }

      // Export operations
      export: {
        showSaveDialog: (options: {
          defaultPath?: string
          filters?: Array<{ name: string; extensions: string[] }>
        }) => Promise<{
          success: boolean
          filePath?: string
          canceled?: boolean
          error?: string
        }>
        writeJson: (
          filePath: string,
          data: any
        ) => Promise<{ success: boolean; error?: string }>
        writeJsonStream: (
          filePath: string,
          filters?: Record<string, unknown>
        ) => Promise<{
          success: boolean
          recordsExported?: number
          error?: string
        }>
        writeCsv: (
          filePath: string,
          filters?: Record<string, unknown>
        ) => Promise<{
          success: boolean
          recordsExported?: number
          error?: string
        }>
        onProgress: (
          callback: (progress: {
            processed: number
            total: number
            percentage: number
          }) => void
        ) => () => void
      }
    }
  }
}

export {}
