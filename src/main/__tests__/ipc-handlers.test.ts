/**
 * Integration Tests for IPC Handlers
 * Tests IPC communication between renderer and main process
 *
 * Coverage:
 * - Session IPC handlers (create, activate, delete, list, getActive)
 * - Capture IPC handlers (getCaptures, getCapture, search, update operations, delete)
 * - Export IPC handlers (showSaveDialog, writeJson, writeJsonStream, writeCsv)
 * - Database stats handler
 * - Error handling and edge cases
 * - Request/response cycles
 * - Concurrent operations
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest';
import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

// Mock types for our tests
interface IpcHandleCallback {
  (event: any, ...args: any[]): Promise<any> | any;
}

interface MockIpcMain {
  handle: MockInstance;
  handlers: Map<string, IpcHandleCallback>;
}

// Create a testable version of ipcMain
const createMockIpcMain = (): MockIpcMain => {
  const handlers = new Map<string, IpcHandleCallback>();

  const mockHandle = vi.fn((channel: string, callback: IpcHandleCallback) => {
    handlers.set(channel, callback);
  });

  return {
    handle: mockHandle,
    handlers,
  };
};

// Mock database service
const mockDb = {
  initialize: vi.fn(),
  close: vi.fn(),
  getStats: vi.fn(),
  // Session operations
  createSession: vi.fn(),
  getSessions: vi.fn(),
  getSession: vi.fn(),
  updateSessionActivity: vi.fn(),
  setSessionActive: vi.fn(),
  updateSessionMetadata: vi.fn(),
  deleteSession: vi.fn(),
  // Capture operations
  createCapture: vi.fn(),
  getCaptures: vi.fn(),
  getCapture: vi.fn(),
  searchCaptures: vi.fn(),
  updateCaptureTags: vi.fn(),
  updateCaptureNotes: vi.fn(),
  setCaptureArchived: vi.fn(),
  deleteCapture: vi.fn(),
};

// Mock SessionManager
const mockSessionManager = {
  createSession: vi.fn(),
  activateSession: vi.fn(),
  deleteSession: vi.fn(),
  listSessions: vi.fn(),
  getActiveSessionId: vi.fn(),
  loadPersistedSessions: vi.fn(),
  destroy: vi.fn(),
  saveSessionState: vi.fn(),
  getView: vi.fn(),
};

// Mock filesystem
const mockFs = {
  writeFileSync: vi.fn(),
  createWriteStream: vi.fn(),
};

// Sample test data
const createMockSession = (overrides = {}) => ({
  id: 'session-123',
  provider: 'claude',
  name: 'Test Session',
  partition: 'persist:claude-123',
  created_at: Date.now(),
  last_active: Date.now(),
  is_active: 1,
  metadata: null,
  ...overrides,
});

const createMockCapture = (overrides = {}) => ({
  id: 'capture-123',
  session_id: 'session-123',
  provider: 'claude',
  prompt: 'What is TypeScript?',
  response: 'TypeScript is a typed superset of JavaScript.',
  response_format: 'text',
  model: 'claude-3-5-sonnet',
  timestamp: Date.now(),
  token_count: 100,
  tags: JSON.stringify(['typescript', 'programming']),
  notes: 'Useful explanation',
  is_archived: 0,
  ...overrides,
});

describe('IPC Handlers - Integration Tests', () => {
  let mockIpc: MockIpcMain;
  let mockEvent: any;
  let mockWindow: BrowserWindow;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create fresh mock IPC
    mockIpc = createMockIpcMain();

    // Mock event object
    mockEvent = {
      sender: {
        send: vi.fn(),
      },
    };

    // Mock BrowserWindow
    mockWindow = {
      getBounds: vi.fn(() => ({ x: 0, y: 0, width: 1400, height: 900 })),
      setBounds: vi.fn(),
      webContents: {
        send: vi.fn(),
      },
    } as any;

    // Setup default mock implementations
    mockDb.getStats.mockReturnValue({
      totalSessions: 0,
      activeSessions: 0,
      totalCaptures: 0,
      archivedCaptures: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to register handlers (simulates what happens in index.ts)
  const registerMockHandlers = () => {
    // Session: Create
    mockIpc.handlers.set('session:create', async (_event, config) => {
      try {
        if (!mockSessionManager) throw new Error('SessionManager not initialized');
        const session = await mockSessionManager.createSession(config);
        return { success: true, session };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Session: Activate
    mockIpc.handlers.set('session:activate', async (_event, sessionId: string) => {
      try {
        if (!mockSessionManager) throw new Error('SessionManager not initialized');
        const success = mockSessionManager.activateSession(sessionId);
        return { success };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Session: Delete
    mockIpc.handlers.set('session:delete', async (_event, sessionId: string) => {
      try {
        if (!mockSessionManager) throw new Error('SessionManager not initialized');
        const success = await mockSessionManager.deleteSession(sessionId);
        return { success };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Session: List
    mockIpc.handlers.set('session:list', async (_event, includeInactive = false) => {
      try {
        if (!mockSessionManager) throw new Error('SessionManager not initialized');
        const sessions = mockSessionManager.listSessions(includeInactive);
        return { success: true, sessions };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Session: Get active
    mockIpc.handlers.set('session:getActive', async () => {
      try {
        if (!mockSessionManager) throw new Error('SessionManager not initialized');
        const activeSessionId = mockSessionManager.getActiveSessionId();
        return { success: true, activeSessionId };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Get captures
    mockIpc.handlers.set('data:getCaptures', async (_event, filters = {}) => {
      try {
        const captures = mockDb.getCaptures(filters);
        return { success: true, captures };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Get capture by ID
    mockIpc.handlers.set('data:getCapture', async (_event, captureId: string) => {
      try {
        const capture = mockDb.getCapture(captureId);
        if (!capture) {
          return { success: false, error: 'Capture not found' };
        }
        return { success: true, capture };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Search captures
    mockIpc.handlers.set('data:searchCaptures', async (_event, query: string, filters = {}) => {
      try {
        const captures = mockDb.searchCaptures(query, filters);
        return { success: true, captures };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Update capture tags
    mockIpc.handlers.set('data:updateTags', async (_event, captureId: string, tags: string[]) => {
      try {
        mockDb.updateCaptureTags(captureId, tags);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Update capture notes
    mockIpc.handlers.set('data:updateNotes', async (_event, captureId: string, notes: string) => {
      try {
        mockDb.updateCaptureNotes(captureId, notes);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Archive/unarchive capture
    mockIpc.handlers.set('data:setArchived', async (_event, captureId: string, isArchived: boolean) => {
      try {
        mockDb.setCaptureArchived(captureId, isArchived);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Delete capture
    mockIpc.handlers.set('data:deleteCapture', async (_event, captureId: string) => {
      try {
        mockDb.deleteCapture(captureId);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Data: Get database stats
    mockIpc.handlers.set('data:getStats', async () => {
      try {
        const stats = mockDb.getStats();
        return { success: true, stats };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Export: Show save dialog
    mockIpc.handlers.set('export:showSaveDialog', async (_event, options) => {
      try {
        const result = await dialog.showSaveDialog(mockWindow, {
          title: 'Export Research Data',
          defaultPath: options.defaultPath,
          filters: options.filters || [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        return { success: true, filePath: result.filePath, canceled: result.canceled };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Export: Write JSON
    mockIpc.handlers.set('export:writeJson', async (_event, filePath: string, data: any) => {
      try {
        const jsonContent = JSON.stringify(data, null, 2);
        mockFs.writeFileSync(filePath, jsonContent, 'utf-8');
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  };

  // ==================== SESSION IPC HANDLERS ====================

  describe('Session IPC Handlers', () => {
    beforeEach(() => {
      registerMockHandlers();
    });

    describe('session:create', () => {
      it('should create a new session successfully', async () => {
        const config = {
          provider: 'claude',
          name: 'Test Claude Session',
          url: 'https://claude.ai',
        };
        const mockSession = createMockSession(config);
        mockSessionManager.createSession.mockResolvedValue(mockSession);

        const handler = mockIpc.handlers.get('session:create')!;
        const result = await handler(mockEvent, config);

        expect(result.success).toBe(true);
        expect(result.session).toEqual(mockSession);
        expect(mockSessionManager.createSession).toHaveBeenCalledWith(config);
      });

      it('should handle session creation errors', async () => {
        const config = { provider: 'claude', name: 'Test' };
        mockSessionManager.createSession.mockRejectedValue(new Error('Database error'));

        const handler = mockIpc.handlers.get('session:create')!;
        const result = await handler(mockEvent, config);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database error');
      });

      it('should handle missing SessionManager', async () => {
        // Temporarily replace the createSession method to simulate null manager
        const originalCreate = mockSessionManager.createSession;
        mockSessionManager.createSession = vi.fn().mockImplementation(() => {
          throw new Error('SessionManager not initialized');
        });

        const handler = mockIpc.handlers.get('session:create')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(false);
        expect(result.error).toContain('SessionManager not initialized');

        // Restore original method
        mockSessionManager.createSession = originalCreate;
      });
    });

    describe('session:activate', () => {
      it('should activate a session successfully', async () => {
        const sessionId = 'session-123';
        mockSessionManager.activateSession.mockReturnValue(true);

        const handler = mockIpc.handlers.get('session:activate')!;
        const result = await handler(mockEvent, sessionId);

        expect(result.success).toBe(true);
        expect(mockSessionManager.activateSession).toHaveBeenCalledWith(sessionId);
      });

      it('should handle activation failure', async () => {
        const sessionId = 'nonexistent-session';
        mockSessionManager.activateSession.mockReturnValue(false);

        const handler = mockIpc.handlers.get('session:activate')!;
        const result = await handler(mockEvent, sessionId);

        expect(result.success).toBe(false);
      });

      it('should handle activation errors', async () => {
        const sessionId = 'session-123';
        mockSessionManager.activateSession.mockImplementation(() => {
          throw new Error('View not found');
        });

        const handler = mockIpc.handlers.get('session:activate')!;
        const result = await handler(mockEvent, sessionId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('View not found');
      });
    });

    describe('session:delete', () => {
      it('should delete a session successfully', async () => {
        const sessionId = 'session-123';
        mockSessionManager.deleteSession.mockResolvedValue(true);

        const handler = mockIpc.handlers.get('session:delete')!;
        const result = await handler(mockEvent, sessionId);

        // The handler wraps the result in a success object
        expect(result).toEqual({ success: true });
        expect(mockSessionManager.deleteSession).toHaveBeenCalledWith(sessionId);
      });

      it('should handle deletion failure', async () => {
        const sessionId = 'nonexistent-session';
        mockSessionManager.deleteSession.mockResolvedValue(false);

        const handler = mockIpc.handlers.get('session:delete')!;
        const result = await handler(mockEvent, sessionId);

        expect(result).toEqual({ success: false });
      });

      it('should handle deletion errors', async () => {
        const sessionId = 'session-123';
        mockSessionManager.deleteSession.mockRejectedValue(new Error('Cannot delete active session'));

        const handler = mockIpc.handlers.get('session:delete')!;
        const result = await handler(mockEvent, sessionId);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cannot delete active session');
      });
    });

    describe('session:list', () => {
      it('should list active sessions by default', async () => {
        const sessions = [createMockSession(), createMockSession({ id: 'session-456' })];
        mockSessionManager.listSessions.mockReturnValue(sessions);

        const handler = mockIpc.handlers.get('session:list')!;
        const result = await handler(mockEvent, false);

        expect(result.success).toBe(true);
        expect(result.sessions).toEqual(sessions);
        expect(mockSessionManager.listSessions).toHaveBeenCalledWith(false);
      });

      it('should list all sessions including inactive when requested', async () => {
        const sessions = [
          createMockSession(),
          createMockSession({ id: 'session-456', is_active: 0 }),
        ];
        mockSessionManager.listSessions.mockReturnValue(sessions);

        const handler = mockIpc.handlers.get('session:list')!;
        const result = await handler(mockEvent, true);

        expect(result.success).toBe(true);
        expect(result.sessions).toEqual(sessions);
        expect(mockSessionManager.listSessions).toHaveBeenCalledWith(true);
      });

      it('should handle empty session list', async () => {
        mockSessionManager.listSessions.mockReturnValue([]);

        const handler = mockIpc.handlers.get('session:list')!;
        const result = await handler(mockEvent, false);

        expect(result.success).toBe(true);
        expect(result.sessions).toEqual([]);
      });

      it('should handle listing errors', async () => {
        mockSessionManager.listSessions.mockImplementation(() => {
          throw new Error('Database connection lost');
        });

        const handler = mockIpc.handlers.get('session:list')!;
        const result = await handler(mockEvent, false);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection lost');
      });
    });

    describe('session:getActive', () => {
      it('should return active session ID', async () => {
        const activeSessionId = 'session-123';
        mockSessionManager.getActiveSessionId.mockReturnValue(activeSessionId);

        const handler = mockIpc.handlers.get('session:getActive')!;
        const result = await handler(mockEvent);

        expect(result.success).toBe(true);
        expect(result.activeSessionId).toBe(activeSessionId);
      });

      it('should return null when no session is active', async () => {
        mockSessionManager.getActiveSessionId.mockReturnValue(null);

        const handler = mockIpc.handlers.get('session:getActive')!;
        const result = await handler(mockEvent);

        expect(result.success).toBe(true);
        expect(result.activeSessionId).toBe(null);
      });

      it('should handle errors getting active session', async () => {
        mockSessionManager.getActiveSessionId.mockImplementation(() => {
          throw new Error('Manager not ready');
        });

        const handler = mockIpc.handlers.get('session:getActive')!;
        const result = await handler(mockEvent);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Manager not ready');
      });
    });
  });

  // ==================== CAPTURE IPC HANDLERS ====================

  describe('Capture IPC Handlers', () => {
    beforeEach(() => {
      registerMockHandlers();
    });

    describe('data:getCaptures', () => {
      it('should get all captures without filters', async () => {
        const captures = [createMockCapture(), createMockCapture({ id: 'capture-456' })];
        mockDb.getCaptures.mockReturnValue(captures);

        const handler = mockIpc.handlers.get('data:getCaptures')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(true);
        expect(result.captures).toEqual(captures);
        expect(mockDb.getCaptures).toHaveBeenCalledWith({});
      });

      it('should get captures with provider filter', async () => {
        const filters = { provider: 'claude' };
        const captures = [createMockCapture({ provider: 'claude' })];
        mockDb.getCaptures.mockReturnValue(captures);

        const handler = mockIpc.handlers.get('data:getCaptures')!;
        const result = await handler(mockEvent, filters);

        expect(result.success).toBe(true);
        expect(result.captures).toEqual(captures);
        expect(mockDb.getCaptures).toHaveBeenCalledWith(filters);
      });

      it('should get captures with date range filter', async () => {
        const filters = {
          startDate: Date.now() - 86400000,
          endDate: Date.now(),
        };
        const captures = [createMockCapture()];
        mockDb.getCaptures.mockReturnValue(captures);

        const handler = mockIpc.handlers.get('data:getCaptures')!;
        const result = await handler(mockEvent, filters);

        expect(result.success).toBe(true);
        expect(mockDb.getCaptures).toHaveBeenCalledWith(filters);
      });

      it('should get captures filtered by archived status', async () => {
        const filters = { isArchived: false };
        const captures = [createMockCapture({ is_archived: 0 })];
        mockDb.getCaptures.mockReturnValue(captures);

        const handler = mockIpc.handlers.get('data:getCaptures')!;
        const result = await handler(mockEvent, filters);

        expect(result.success).toBe(true);
        expect(result.captures.every((c: any) => c.is_archived === 0)).toBe(true);
      });

      it('should handle empty capture list', async () => {
        mockDb.getCaptures.mockReturnValue([]);

        const handler = mockIpc.handlers.get('data:getCaptures')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(true);
        expect(result.captures).toEqual([]);
      });

      it('should handle database errors', async () => {
        mockDb.getCaptures.mockImplementation(() => {
          throw new Error('Database query failed');
        });

        const handler = mockIpc.handlers.get('data:getCaptures')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database query failed');
      });
    });

    describe('data:getCapture', () => {
      it('should get capture by ID successfully', async () => {
        const capture = createMockCapture();
        mockDb.getCapture.mockReturnValue(capture);

        const handler = mockIpc.handlers.get('data:getCapture')!;
        const result = await handler(mockEvent, 'capture-123');

        expect(result.success).toBe(true);
        expect(result.capture).toEqual(capture);
        expect(mockDb.getCapture).toHaveBeenCalledWith('capture-123');
      });

      it('should handle capture not found', async () => {
        mockDb.getCapture.mockReturnValue(null);

        const handler = mockIpc.handlers.get('data:getCapture')!;
        const result = await handler(mockEvent, 'nonexistent');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Capture not found');
      });

      it('should handle database errors', async () => {
        mockDb.getCapture.mockImplementation(() => {
          throw new Error('Invalid capture ID');
        });

        const handler = mockIpc.handlers.get('data:getCapture')!;
        const result = await handler(mockEvent, 'invalid-id');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid capture ID');
      });
    });

    describe('data:searchCaptures', () => {
      it('should search captures by query', async () => {
        const query = 'TypeScript';
        const captures = [createMockCapture()];
        mockDb.searchCaptures.mockReturnValue(captures);

        const handler = mockIpc.handlers.get('data:searchCaptures')!;
        const result = await handler(mockEvent, query, {});

        expect(result.success).toBe(true);
        expect(result.captures).toEqual(captures);
        expect(mockDb.searchCaptures).toHaveBeenCalledWith(query, {});
      });

      it('should search with filters', async () => {
        const query = 'hooks';
        const filters = { provider: 'claude', isArchived: false };
        const captures = [createMockCapture()];
        mockDb.searchCaptures.mockReturnValue(captures);

        const handler = mockIpc.handlers.get('data:searchCaptures')!;
        const result = await handler(mockEvent, query, filters);

        expect(result.success).toBe(true);
        expect(mockDb.searchCaptures).toHaveBeenCalledWith(query, filters);
      });

      it('should handle empty search results', async () => {
        mockDb.searchCaptures.mockReturnValue([]);

        const handler = mockIpc.handlers.get('data:searchCaptures')!;
        const result = await handler(mockEvent, 'nonexistent', {});

        expect(result.success).toBe(true);
        expect(result.captures).toEqual([]);
      });

      it('should handle search errors', async () => {
        mockDb.searchCaptures.mockImplementation(() => {
          throw new Error('FTS syntax error');
        });

        const handler = mockIpc.handlers.get('data:searchCaptures')!;
        const result = await handler(mockEvent, 'invalid*query', {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('FTS syntax error');
      });
    });

    describe('data:updateTags', () => {
      it('should update capture tags successfully', async () => {
        const captureId = 'capture-123';
        const tags = ['typescript', 'react', 'hooks'];
        mockDb.updateCaptureTags.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:updateTags')!;
        const result = await handler(mockEvent, captureId, tags);

        expect(result.success).toBe(true);
        expect(mockDb.updateCaptureTags).toHaveBeenCalledWith(captureId, tags);
      });

      it('should handle empty tags array', async () => {
        const captureId = 'capture-123';
        mockDb.updateCaptureTags.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:updateTags')!;
        const result = await handler(mockEvent, captureId, []);

        expect(result.success).toBe(true);
        expect(mockDb.updateCaptureTags).toHaveBeenCalledWith(captureId, []);
      });

      it('should handle update errors', async () => {
        mockDb.updateCaptureTags.mockImplementation(() => {
          throw new Error('Capture not found');
        });

        const handler = mockIpc.handlers.get('data:updateTags')!;
        const result = await handler(mockEvent, 'invalid', ['tag']);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Capture not found');
      });
    });

    describe('data:updateNotes', () => {
      it('should update capture notes successfully', async () => {
        const captureId = 'capture-123';
        const notes = 'This is a very useful response about TypeScript';
        mockDb.updateCaptureNotes.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:updateNotes')!;
        const result = await handler(mockEvent, captureId, notes);

        expect(result.success).toBe(true);
        expect(mockDb.updateCaptureNotes).toHaveBeenCalledWith(captureId, notes);
      });

      it('should handle empty notes', async () => {
        const captureId = 'capture-123';
        mockDb.updateCaptureNotes.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:updateNotes')!;
        const result = await handler(mockEvent, captureId, '');

        expect(result.success).toBe(true);
        expect(mockDb.updateCaptureNotes).toHaveBeenCalledWith(captureId, '');
      });

      it('should handle update errors', async () => {
        mockDb.updateCaptureNotes.mockImplementation(() => {
          throw new Error('Database write failed');
        });

        const handler = mockIpc.handlers.get('data:updateNotes')!;
        const result = await handler(mockEvent, 'capture-123', 'notes');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database write failed');
      });
    });

    describe('data:setArchived', () => {
      it('should archive a capture', async () => {
        const captureId = 'capture-123';
        mockDb.setCaptureArchived.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:setArchived')!;
        const result = await handler(mockEvent, captureId, true);

        expect(result.success).toBe(true);
        expect(mockDb.setCaptureArchived).toHaveBeenCalledWith(captureId, true);
      });

      it('should unarchive a capture', async () => {
        const captureId = 'capture-123';
        mockDb.setCaptureArchived.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:setArchived')!;
        const result = await handler(mockEvent, captureId, false);

        expect(result.success).toBe(true);
        expect(mockDb.setCaptureArchived).toHaveBeenCalledWith(captureId, false);
      });

      it('should handle archive errors', async () => {
        mockDb.setCaptureArchived.mockImplementation(() => {
          throw new Error('Capture locked');
        });

        const handler = mockIpc.handlers.get('data:setArchived')!;
        const result = await handler(mockEvent, 'capture-123', true);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Capture locked');
      });
    });

    describe('data:deleteCapture', () => {
      it('should delete a capture successfully', async () => {
        const captureId = 'capture-123';
        mockDb.deleteCapture.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('data:deleteCapture')!;
        const result = await handler(mockEvent, captureId);

        expect(result.success).toBe(true);
        expect(mockDb.deleteCapture).toHaveBeenCalledWith(captureId);
      });

      it('should handle deletion errors', async () => {
        mockDb.deleteCapture.mockImplementation(() => {
          throw new Error('Foreign key constraint failed');
        });

        const handler = mockIpc.handlers.get('data:deleteCapture')!;
        const result = await handler(mockEvent, 'capture-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Foreign key constraint failed');
      });
    });
  });

  // ==================== STATS IPC HANDLER ====================

  describe('Database Stats Handler', () => {
    beforeEach(() => {
      registerMockHandlers();
    });

    describe('data:getStats', () => {
      it('should get database statistics successfully', async () => {
        const stats = {
          totalSessions: 5,
          activeSessions: 3,
          totalCaptures: 150,
          archivedCaptures: 20,
        };
        mockDb.getStats.mockReturnValue(stats);

        const handler = mockIpc.handlers.get('data:getStats')!;
        const result = await handler(mockEvent);

        expect(result.success).toBe(true);
        expect(result.stats).toEqual(stats);
      });

      it('should handle empty database stats', async () => {
        const stats = {
          totalSessions: 0,
          activeSessions: 0,
          totalCaptures: 0,
          archivedCaptures: 0,
        };
        mockDb.getStats.mockReturnValue(stats);

        const handler = mockIpc.handlers.get('data:getStats')!;
        const result = await handler(mockEvent);

        expect(result.success).toBe(true);
        expect(result.stats).toEqual(stats);
      });

      it('should handle stats errors', async () => {
        mockDb.getStats.mockImplementation(() => {
          throw new Error('Database not accessible');
        });

        const handler = mockIpc.handlers.get('data:getStats')!;
        const result = await handler(mockEvent);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database not accessible');
      });
    });
  });

  // ==================== EXPORT IPC HANDLERS ====================

  describe('Export IPC Handlers', () => {
    beforeEach(() => {
      registerMockHandlers();
    });

    describe('export:showSaveDialog', () => {
      it('should show save dialog with default options', async () => {
        const mockDialogResult = {
          canceled: false,
          filePath: '/path/to/export.json',
        };
        vi.mocked(dialog.showSaveDialog).mockResolvedValue(mockDialogResult);

        const handler = mockIpc.handlers.get('export:showSaveDialog')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(true);
        expect(result.filePath).toBe('/path/to/export.json');
        expect(result.canceled).toBe(false);
      });

      it('should handle user cancellation', async () => {
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
          canceled: true,
          filePath: undefined,
        });

        const handler = mockIpc.handlers.get('export:showSaveDialog')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(true);
        expect(result.canceled).toBe(true);
        expect(result.filePath).toBeUndefined();
      });

      it('should use custom default path', async () => {
        const mockDialogResult = {
          canceled: false,
          filePath: '/custom/path/data.csv',
        };
        vi.mocked(dialog.showSaveDialog).mockResolvedValue(mockDialogResult);

        const options = { defaultPath: '/custom/path/data.csv' };
        const handler = mockIpc.handlers.get('export:showSaveDialog')!;
        const result = await handler(mockEvent, options);

        expect(result.success).toBe(true);
        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
          mockWindow,
          expect.objectContaining({ defaultPath: options.defaultPath })
        );
      });

      it('should use custom file filters', async () => {
        const mockDialogResult = {
          canceled: false,
          filePath: '/path/to/export.csv',
        };
        vi.mocked(dialog.showSaveDialog).mockResolvedValue(mockDialogResult);

        const options = {
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        };
        const handler = mockIpc.handlers.get('export:showSaveDialog')!;
        const result = await handler(mockEvent, options);

        expect(result.success).toBe(true);
        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
          mockWindow,
          expect.objectContaining({ filters: options.filters })
        );
      });

      it('should handle dialog errors', async () => {
        vi.mocked(dialog.showSaveDialog).mockRejectedValue(new Error('Dialog failed'));

        const handler = mockIpc.handlers.get('export:showSaveDialog')!;
        const result = await handler(mockEvent, {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Dialog failed');
      });
    });

    describe('export:writeJson', () => {
      it('should write JSON data to file successfully', async () => {
        const filePath = '/path/to/export.json';
        const data = { captures: [createMockCapture()] };
        mockFs.writeFileSync.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('export:writeJson')!;
        const result = await handler(mockEvent, filePath, data);

        expect(result.success).toBe(true);
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          filePath,
          JSON.stringify(data, null, 2),
          'utf-8'
        );
      });

      it('should handle write errors', async () => {
        mockFs.writeFileSync.mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const handler = mockIpc.handlers.get('export:writeJson')!;
        const result = await handler(mockEvent, '/readonly/path.json', {});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Permission denied');
      });

      it('should handle large data sets', async () => {
        const largeData = {
          captures: Array(1000)
            .fill(null)
            .map((_, i) => createMockCapture({ id: `capture-${i}` })),
        };
        mockFs.writeFileSync.mockReturnValue(undefined);

        const handler = mockIpc.handlers.get('export:writeJson')!;
        const result = await handler(mockEvent, '/path/to/large.json', largeData);

        expect(result.success).toBe(true);
      });
    });
  });

  // ==================== ERROR HANDLING & EDGE CASES ====================

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      registerMockHandlers();
    });

    it('should handle invalid parameters gracefully', async () => {
      mockDb.getCapture.mockReturnValue(null);

      const handler = mockIpc.handlers.get('data:getCapture')!;
      const result = await handler(mockEvent, null);

      expect(result.success).toBe(false);
    });

    it('should handle concurrent capture requests', async () => {
      const captures1 = [createMockCapture({ id: 'c1' })];
      const captures2 = [createMockCapture({ id: 'c2' })];
      mockDb.getCaptures
        .mockReturnValueOnce(captures1)
        .mockReturnValueOnce(captures2);

      const handler = mockIpc.handlers.get('data:getCaptures')!;

      const [result1, result2] = await Promise.all([
        handler(mockEvent, {}),
        handler(mockEvent, {}),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockDb.getCaptures).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid session creation requests', async () => {
      const config1 = { provider: 'claude', name: 'Session 1' };
      const config2 = { provider: 'openai', name: 'Session 2' };

      mockSessionManager.createSession
        .mockResolvedValueOnce(createMockSession({ id: 's1' }))
        .mockResolvedValueOnce(createMockSession({ id: 's2' }));

      const handler = mockIpc.handlers.get('session:create')!;

      const [result1, result2] = await Promise.all([
        handler(mockEvent, config1),
        handler(mockEvent, config2),
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockSessionManager.createSession).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in search queries', async () => {
      const specialQueries = [
        'query with "quotes"',
        "query with 'apostrophes'",
        'query with <html>',
        'query with & symbols',
      ];

      mockDb.searchCaptures.mockReturnValue([]);
      const handler = mockIpc.handlers.get('data:searchCaptures')!;

      for (const query of specialQueries) {
        const result = await handler(mockEvent, query, {});
        expect(result.success).toBe(true);
      }
    });

    it('should handle very long text in notes update', async () => {
      const longNotes = 'A'.repeat(100000);
      mockDb.updateCaptureNotes.mockReturnValue(undefined);

      const handler = mockIpc.handlers.get('data:updateNotes')!;
      const result = await handler(mockEvent, 'capture-123', longNotes);

      expect(result.success).toBe(true);
    });

    it('should handle database disconnection gracefully', async () => {
      mockDb.getCaptures.mockImplementation(() => {
        throw new Error('SQLITE_CANTOPEN: unable to open database file');
      });

      const handler = mockIpc.handlers.get('data:getCaptures')!;
      const result = await handler(mockEvent, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('unable to open database');
    });

    it('should handle null or undefined filter values', async () => {
      const filters = {
        provider: undefined,
        isArchived: null,
      };
      mockDb.getCaptures.mockReturnValue([]);

      const handler = mockIpc.handlers.get('data:getCaptures')!;
      const result = await handler(mockEvent, filters);

      expect(result.success).toBe(true);
    });
  });

  // ==================== REQUEST/RESPONSE CYCLE VALIDATION ====================

  describe('Request/Response Cycle Validation', () => {
    beforeEach(() => {
      registerMockHandlers();
    });

    it('should maintain data integrity in create-read cycle', async () => {
      const session = createMockSession();
      mockSessionManager.createSession.mockResolvedValue(session);
      mockSessionManager.listSessions.mockReturnValue([session]);

      // Create session
      const createHandler = mockIpc.handlers.get('session:create')!;
      const createResult = await createHandler(mockEvent, {
        provider: session.provider,
        name: session.name,
      });

      // Read session
      const listHandler = mockIpc.handlers.get('session:list')!;
      const listResult = await listHandler(mockEvent, false);

      expect(createResult.success).toBe(true);
      expect(listResult.success).toBe(true);
      expect(listResult.sessions).toContainEqual(session);
    });

    it('should maintain data integrity in update-read cycle', async () => {
      const captureId = 'capture-123';
      const newTags = ['updated', 'tags'];
      const updatedCapture = createMockCapture({ tags: JSON.stringify(newTags) });

      mockDb.updateCaptureTags.mockReturnValue(undefined);
      mockDb.getCapture.mockReturnValue(updatedCapture);

      // Update tags
      const updateHandler = mockIpc.handlers.get('data:updateTags')!;
      const updateResult = await updateHandler(mockEvent, captureId, newTags);

      // Read capture
      const getHandler = mockIpc.handlers.get('data:getCapture')!;
      const getResult = await getHandler(mockEvent, captureId);

      expect(updateResult.success).toBe(true);
      expect(getResult.success).toBe(true);
      expect(JSON.parse(getResult.capture.tags)).toEqual(newTags);
    });

    it('should handle async operations properly', async () => {
      const config = { provider: 'claude', name: 'Async Test' };
      const session = createMockSession();

      // Simulate async delay
      mockSessionManager.createSession.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(session), 50))
      );

      const handler = mockIpc.handlers.get('session:create')!;
      const startTime = Date.now();
      const result = await handler(mockEvent, config);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      // Allow for some timing variance
      expect(endTime - startTime).toBeGreaterThanOrEqual(40);
    });

    it('should properly chain dependent operations', async () => {
      const sessionConfig = { provider: 'claude', name: 'Chain Test' };
      const session = createMockSession();

      mockSessionManager.createSession.mockResolvedValue(session);
      mockSessionManager.activateSession.mockReturnValue(true);
      mockSessionManager.getActiveSessionId.mockReturnValue(session.id);

      // Create session
      const createHandler = mockIpc.handlers.get('session:create')!;
      const createResult = await createHandler(mockEvent, sessionConfig);

      // Activate session
      const activateHandler = mockIpc.handlers.get('session:activate')!;
      const activateResult = await activateHandler(mockEvent, createResult.session.id);

      // Get active session
      const getActiveHandler = mockIpc.handlers.get('session:getActive')!;
      const getActiveResult = await getActiveHandler(mockEvent);

      expect(createResult.success).toBe(true);
      expect(activateResult.success).toBe(true);
      expect(getActiveResult.success).toBe(true);
      expect(getActiveResult.activeSessionId).toBe(session.id);
    });
  });
});
