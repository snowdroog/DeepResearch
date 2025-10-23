import { contextBridge, ipcRenderer } from 'electron'

// Type-safe IPC API
const electronAPI = {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Auth (placeholder for future implementation)
  auth: {
    login: (provider: string) => ipcRenderer.invoke('auth:login', provider),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getSession: () => ipcRenderer.invoke('auth:get-session'),
  },

  // Session management
  sessions: {
    create: (config: { provider: 'claude' | 'openai' | 'gemini' | 'custom'; name: string; url?: string }) =>
      ipcRenderer.invoke('session:create', config),
    createCaptureSession: (config: { captureId: string; name: string }) =>
      ipcRenderer.invoke('session:createCaptureSession', config),
    activate: (sessionId: string) => ipcRenderer.invoke('session:activate', sessionId),
    delete: (sessionId: string) => ipcRenderer.invoke('session:delete', sessionId),
    list: (includeInactive?: boolean) => ipcRenderer.invoke('session:list', includeInactive),
    getActive: () => ipcRenderer.invoke('session:getActive'),
    captureCurrentPage: (sessionId: string) => ipcRenderer.invoke('session:captureCurrentPage', sessionId),
    onSessionCreated: (callback: (data: { sessionId: string; provider: string; name: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data)
      ipcRenderer.on('session:created', listener)
      return () => ipcRenderer.removeListener('session:created', listener)
    },
    onSessionDeleted: (callback: (data: { sessionId: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data)
      ipcRenderer.on('session:deleted', listener)
      return () => ipcRenderer.removeListener('session:deleted', listener)
    },
  },

  // View management
  views: {
    updateBounds: (sessionId: string, bounds: { x: number; y: number; width: number; height: number }) =>
      ipcRenderer.invoke('view:updateBounds', sessionId, bounds),
    setVisible: (sessionId: string, visible: boolean) =>
      ipcRenderer.invoke('view:setVisible', sessionId, visible),
  },

  // Data operations
  data: {
    getCaptures: (filters?: Record<string, unknown>) => ipcRenderer.invoke('data:getCaptures', filters),
    getCapture: (captureId: string) => ipcRenderer.invoke('data:getCapture', captureId),
    searchCaptures: (query: string, filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('data:searchCaptures', query, filters),
    updateTags: (captureId: string, tags: string[]) => ipcRenderer.invoke('data:updateTags', captureId, tags),
    updateNotes: (captureId: string, notes: string) => ipcRenderer.invoke('data:updateNotes', captureId, notes),
    updateMessageType: (captureId: string, messageType: 'chat' | 'deep_research' | 'image' | 'code') =>
      ipcRenderer.invoke('data:updateMessageType', captureId, messageType),
    updateTopic: (captureId: string, topic: string | null) =>
      ipcRenderer.invoke('data:updateTopic', captureId, topic),
    updateMetadata: (captureId: string, metadata: Record<string, any> | null) =>
      ipcRenderer.invoke('data:updateMetadata', captureId, metadata),
    setArchived: (captureId: string, isArchived: boolean) =>
      ipcRenderer.invoke('data:setArchived', captureId, isArchived),
    deleteCapture: (captureId: string) => ipcRenderer.invoke('data:deleteCapture', captureId),
    getStats: () => ipcRenderer.invoke('data:getStats'),
    getAllTags: () => ipcRenderer.invoke('data:getAllTags'),
    onCapture: (callback: (data: { captureId: string; sessionId: string; provider: string; preview: string }) => void) => {
      const listener = (_event: any, data: any) => callback(data)
      ipcRenderer.on('response:captured', listener)
      return () => ipcRenderer.removeListener('response:captured', listener)
    },
  },

  // Export operations
  export: {
    showSaveDialog: (options: {
      defaultPath?: string
      filters?: Array<{ name: string; extensions: string[] }>
    }) => ipcRenderer.invoke('export:showSaveDialog', options),
    writeJson: (filePath: string, data: any) => ipcRenderer.invoke('export:writeJson', filePath, data),
    writeJsonStream: (filePath: string, filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('export:writeJsonStream', filePath, filters),
    writeCsv: (filePath: string, filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('export:writeCsv', filePath, filters),
    onProgress: (callback: (progress: { processed: number; total: number; percentage: number }) => void) => {
      const listener = (_event: any, progress: any) => callback(progress)
      ipcRenderer.on('export:progress', listener)
      return () => ipcRenderer.removeListener('export:progress', listener)
    },
  },
}

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Expose raw electron API for testing
// Note: This provides direct IPC access for E2E tests
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, func: (...args: any[]) => void) => ipcRenderer.on(channel, func),
    removeListener: (channel: string, func: (...args: any[]) => void) => ipcRenderer.removeListener(channel, func),
  },
})

// Type definitions for renderer
export type ElectronAPI = typeof electronAPI
