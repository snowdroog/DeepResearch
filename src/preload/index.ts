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
    activate: (sessionId: string) => ipcRenderer.invoke('session:activate', sessionId),
    delete: (sessionId: string) => ipcRenderer.invoke('session:delete', sessionId),
    list: (includeInactive?: boolean) => ipcRenderer.invoke('session:list', includeInactive),
    getActive: () => ipcRenderer.invoke('session:getActive'),
  },

  // Data operations
  data: {
    getCaptures: (filters?: Record<string, unknown>) => ipcRenderer.invoke('data:getCaptures', filters),
    getCapture: (captureId: string) => ipcRenderer.invoke('data:getCapture', captureId),
    searchCaptures: (query: string, filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('data:searchCaptures', query, filters),
    updateTags: (captureId: string, tags: string[]) => ipcRenderer.invoke('data:updateTags', captureId, tags),
    updateNotes: (captureId: string, notes: string) => ipcRenderer.invoke('data:updateNotes', captureId, notes),
    setArchived: (captureId: string, isArchived: boolean) =>
      ipcRenderer.invoke('data:setArchived', captureId, isArchived),
    deleteCapture: (captureId: string) => ipcRenderer.invoke('data:deleteCapture', captureId),
    getStats: () => ipcRenderer.invoke('data:getStats'),
  },
}

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type definitions for renderer
export type ElectronAPI = typeof electronAPI
