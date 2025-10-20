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

  // Session management (placeholder)
  sessions: {
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('session:create', data),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
    list: () => ipcRenderer.invoke('session:list'),
  },

  // Data operations (placeholder)
  data: {
    query: (filters: Record<string, unknown>) => ipcRenderer.invoke('data:query', filters),
    export: (format: string) => ipcRenderer.invoke('data:export', format),
  },
}

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type definitions for renderer
export type ElectronAPI = typeof electronAPI
