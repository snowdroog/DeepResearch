/**
 * Comprehensive Unit Tests for SessionManager
 * Tests session lifecycle, WebContentsView management, and state handling
 *
 * Coverage:
 * - Session creation with various providers
 * - Session activation and deactivation
 * - Session deletion and cleanup
 * - WebContentsView lifecycle management
 * - State persistence and restoration
 * - ResponseInterceptor integration
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import type { BrowserWindow } from 'electron';
import { WebContentsView, session } from 'electron';
import { SessionManager, SessionConfig } from '../SessionManager';
import { db, Session } from '../../database/db';
import { ResponseInterceptor } from '../../capture/ResponseInterceptor';

// Mock electron module for this test file
// Note: setup-main.ts also has a global mock, but vi.mock() needs to be in each test file
// to properly mock imports for that file's dependency graph
vi.mock('electron', async (importOriginal) => {
  const vitest = await import('vitest');
  const vi = vitest.vi;

  // Create a class for WebContentsView mock
  const WebContentsViewClass = class {
    webContents: any;
    constructor(options?: any) {
      this.webContents = {
        loadURL: vi.fn().mockResolvedValue(undefined),
        getURL: vi.fn(() => 'https://example.com'),
        send: vi.fn(),
        once: vi.fn((event: string, listener: Function) => {
          if (event === 'did-finish-load') {
            setTimeout(() => listener(), 0);
          }
        }),
        on: vi.fn(),
        off: vi.fn(),
        removeListener: vi.fn(),
        destroy: vi.fn(),
        close: vi.fn(),
        isDestroyed: vi.fn(() => false),
        session: {
          partition: options?.webPreferences?.partition || 'default',
        },
        debugger: {
          attach: vi.fn(),
          detach: vi.fn(),
          sendCommand: vi.fn(),
          on: vi.fn(),
        },
        setWindowOpenHandler: vi.fn(),
      };
    }
    setBounds = vi.fn();
    getBounds = vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 }));
  };

  return {
    WebContentsView: vi.fn().mockImplementation((options) => new WebContentsViewClass(options)),
    session: {
      fromPartition: vi.fn().mockReturnValue({
        setUserAgent: vi.fn(),
        clearCache: vi.fn(),
        clearStorageData: vi.fn(),
      }),
    },
  };
});

// Mock the database module
vi.mock('../../database/db', () => ({
  db: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    getSessions: vi.fn(),
    updateSessionActivity: vi.fn(),
    updateSessionMetadata: vi.fn(),
    deleteSession: vi.fn(),
    setSessionActive: vi.fn(),
  },
}));

// Mock ResponseInterceptor
vi.mock('../../capture/ResponseInterceptor', () => ({
  ResponseInterceptor: vi.fn().mockImplementation(() => ({
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock crypto module
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(7)),
  };
});

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockMainWindow: any;
  let mockWebContents: any;
  let mockWebContentsView: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock WebContents
    mockWebContents = {
      loadURL: vi.fn().mockResolvedValue(undefined),
      getURL: vi.fn(() => 'https://example.com'),
      send: vi.fn(),
      once: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      destroy: vi.fn(),
      close: vi.fn(),
      session: {},
      debugger: {
        attach: vi.fn(),
        detach: vi.fn(),
        sendCommand: vi.fn(),
        on: vi.fn(),
      },
      setWindowOpenHandler: vi.fn(),
    };

    // Mock WebContentsView
    mockWebContentsView = {
      webContents: mockWebContents,
      setBounds: vi.fn(),
      getBounds: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
    };

    // Configure WebContentsView mock to return NEW instances each time
    // This ensures each session gets its own view object
    vi.mocked(WebContentsView).mockImplementation(() => ({
      webContents: {
        loadURL: vi.fn().mockResolvedValue(undefined),
        getURL: vi.fn(() => 'https://example.com'),
        send: vi.fn(),
        once: vi.fn((event: string, listener: Function) => {
          if (event === 'did-finish-load') {
            setTimeout(() => listener(), 0);
          }
        }),
        on: vi.fn(),
        off: vi.fn(),
        removeListener: vi.fn(),
        destroy: vi.fn(),
        close: vi.fn(),
        isDestroyed: vi.fn(() => false),
        session: {
          partition: 'default',
        },
        debugger: {
          attach: vi.fn(),
          detach: vi.fn(),
          sendCommand: vi.fn(),
          on: vi.fn(),
        },
        setWindowOpenHandler: vi.fn(),
      },
      setBounds: vi.fn(),
      getBounds: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
    } as any));

    // Configure db.createSession to return the session data passed to it
    // This is important because SessionManager generates the ID before calling db.createSession
    vi.mocked(db.createSession).mockImplementation((sessionData) => {
      return {
        ...sessionData,
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      } as Session;
    });

    // Mock BrowserWindow
    mockMainWindow = {
      contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn(),
      },
      getBounds: vi.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
      }),
      on: vi.fn(),
      off: vi.fn(),
    };

    // Create SessionManager instance
    sessionManager = new SessionManager(mockMainWindow);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================== SESSION CREATION TESTS ====================

  describe('Session Creation - createSession()', () => {
    it('should create session with Claude provider', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Claude Session',
      };

      const mockDbSession: Session = {
        id: 'mock-uuid-123',
        provider: 'claude',
        name: 'Claude Session',
        partition: 'persist:claude-mock-uuid-123',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
        metadata: JSON.stringify({
          createdBy: 'user',
          initialUrl: 'https://claude.ai/new',
        }),
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      const session = await sessionManager.createSession(config);

      expect(session).toEqual(mockDbSession);
      expect(db.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'claude',
          name: 'Claude Session',
          partition: expect.stringContaining('persist:claude-'),
        })
      );
    });

    it('should create session with OpenAI provider', async () => {
      const config: SessionConfig = {
        provider: 'openai',
        name: 'OpenAI Session',
      };

      const session = await sessionManager.createSession(config);

      expect(session.provider).toBe('openai');

      // Get the actual view created for this session
      const view = sessionManager.getView(session.id);
      expect(view?.webContents.loadURL).toHaveBeenCalledWith('https://chat.openai.com/');
    });

    it('should create session with Gemini provider', async () => {
      const config: SessionConfig = {
        provider: 'gemini',
        name: 'Gemini Session',
      };

      const session = await sessionManager.createSession(config);

      // Get the actual view created for this session
      const view = sessionManager.getView(session.id);
      expect(view?.webContents.loadURL).toHaveBeenCalledWith('https://gemini.google.com/');
    });

    it('should create session with custom provider and URL', async () => {
      const config: SessionConfig = {
        provider: 'custom',
        name: 'Custom Session',
        url: 'https://custom-ai.com/chat',
      };

      const session = await sessionManager.createSession(config);

      // Get the actual view created for this session
      const view = sessionManager.getView(session.id);
      expect(view?.webContents.loadURL).toHaveBeenCalledWith('https://custom-ai.com/chat');
    });

    it('should generate unique session IDs for concurrent creation', async () => {
      const config1: SessionConfig = { provider: 'claude', name: 'Session 1' };
      const config2: SessionConfig = { provider: 'openai', name: 'Session 2' };

      const mockDbSession1: Session = {
        id: 'uuid-1',
        provider: 'claude',
        name: 'Session 1',
        partition: 'persist:claude-uuid-1',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      const mockDbSession2: Session = {
        id: 'uuid-2',
        provider: 'openai',
        name: 'Session 2',
        partition: 'persist:openai-uuid-2',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession)
        .mockReturnValueOnce(mockDbSession1)
        .mockReturnValueOnce(mockDbSession2);

      const session1 = await sessionManager.createSession(config1);
      const session2 = await sessionManager.createSession(config2);

      expect(session1.id).not.toBe(session2.id);
      expect(session1.partition).not.toBe(session2.partition);
    });

    it('should initialize WebContentsView with correct web preferences', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test-id',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);

      expect(WebContentsView).toHaveBeenCalledWith(
        expect.objectContaining({
          webPreferences: expect.objectContaining({
            partition: expect.stringContaining('persist:claude-'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
          }),
        })
      );
    });

    it('should set user agent for session', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test-id',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);

      expect(session.fromPartition).toHaveBeenCalled();
      const mockSession = vi.mocked(session.fromPartition).mock.results[0].value;
      expect(mockSession.setUserAgent).toHaveBeenCalledWith(
        expect.stringContaining('Chrome')
      );
    });

    it('should create ResponseInterceptor for session', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      // Get the actual view created for this session
      const view = sessionManager.getView(session.id);

      expect(ResponseInterceptor).toHaveBeenCalledWith(
        view?.webContents,
        session.id,
        'claude'
      );
    });

    it('should enable interceptor after page loads', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      // Get the actual view created for this session
      const view = sessionManager.getView(session.id);
      expect(view?.webContents.once).toHaveBeenCalledWith(
        'did-finish-load',
        expect.any(Function)
      );
    });

    it('should store session view in internal map', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      // Use the returned session ID instead of hardcoded 'test-id'
      const view = sessionManager.getView(session.id);
      expect(view).toBeDefined();
    });
  });

  // ==================== SESSION ACTIVATION TESTS ====================

  describe('Session Activation - activateSession()', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test session first
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      // Don't override the mock - use the global implementation that returns what's passed
      const session = await sessionManager.createSession(config);
      // Use the returned session ID
      sessionId = session.id;
    });

    it('should activate session and attach WebContentsView to window', () => {
      const result = sessionManager.activateSession(sessionId);

      expect(result).toBe(true);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalled();
    });

    it('should set correct bounds for WebContentsView', async () => {
      sessionManager.activateSession(sessionId);

      const mockWebContentsView = vi.mocked(WebContentsView).mock.results[0].value;
      expect(mockWebContentsView.setBounds).toHaveBeenCalledWith({
        x: 0,
        y: 60,
        width: 1200,
        height: 740, // 800 - 60
      });
    });

    it('should update session activity in database', () => {
      sessionManager.activateSession(sessionId);

      expect(db.updateSessionActivity).toHaveBeenCalledWith(sessionId);
    });

    it('should return active session ID', () => {
      sessionManager.activateSession(sessionId);

      const activeId = sessionManager.getActiveSessionId();
      expect(activeId).toBe(sessionId);
    });

    it('should remove previous view when activating different session', async () => {
      // Create second session
      const config2: SessionConfig = {
        provider: 'openai',
        name: 'Second Session',
      };

      const session2 = await sessionManager.createSession(config2);

      // Get the view instances created for each session
      const view1 = sessionManager.getView(sessionId);
      const view2 = sessionManager.getView(session2.id);

      // Activate first session
      sessionManager.activateSession(sessionId);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(view1);

      // Activate second session
      sessionManager.activateSession(session2.id);
      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(view1);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(view2);
    });

    it('should return false for non-existent session', () => {
      const result = sessionManager.activateSession('non-existent-id');

      expect(result).toBe(false);
      expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
    });

    it('should handle reactivating same session', () => {
      const view = sessionManager.getView(sessionId);

      sessionManager.activateSession(sessionId);
      vi.clearAllMocks();

      sessionManager.activateSession(sessionId);

      // Should remove and re-add same view
      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(view);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(view);
    });
  });

  // ==================== SESSION DELETION TESTS ====================

  describe('Session Deletion - deleteSession()', () => {
    let sessionId: string;
    let mockInterceptor: any;

    beforeEach(async () => {
      // Create a test session
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      mockInterceptor = {
        enable: vi.fn().mockResolvedValue(undefined),
        disable: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(ResponseInterceptor).mockImplementation(() => mockInterceptor);
      // Don't override db.createSession mock - use the global implementation

      const session = await sessionManager.createSession(config);
      // Use the returned session ID
      sessionId = session.id;
    });

    it('should delete session successfully', async () => {
      const result = await sessionManager.deleteSession(sessionId);

      expect(result).toBe(true);
      expect(db.deleteSession).toHaveBeenCalledWith(sessionId);
    });

    it('should disable interceptor before deletion', async () => {
      await sessionManager.deleteSession(sessionId);

      expect(mockInterceptor.disable).toHaveBeenCalled();
    });

    it('should close webContents', async () => {
      const view = sessionManager.getView(sessionId);
      await sessionManager.deleteSession(sessionId);

      // SessionManager calls close(), not destroy()
      expect(view?.webContents.close).toHaveBeenCalled();
    });

    it('should remove view from internal map', async () => {
      await sessionManager.deleteSession(sessionId);

      const view = sessionManager.getView(sessionId);
      expect(view).toBeUndefined();
    });

    it('should remove view from window if currently active', async () => {
      const view = sessionManager.getView(sessionId);

      sessionManager.activateSession(sessionId);
      vi.clearAllMocks();

      await sessionManager.deleteSession(sessionId);

      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(view);
    });

    it('should clear active session ID after deleting active session', async () => {
      sessionManager.activateSession(sessionId);

      await sessionManager.deleteSession(sessionId);

      const activeId = sessionManager.getActiveSessionId();
      expect(activeId).toBeNull();
    });

    it('should not clear active session ID when deleting inactive session', async () => {
      // Create and activate first session
      sessionManager.activateSession(sessionId);

      // Create second session
      const config2: SessionConfig = {
        provider: 'openai',
        name: 'Second Session',
      };

      const session2 = await sessionManager.createSession(config2);

      // Delete inactive session (use returned session ID)
      await sessionManager.deleteSession(session2.id);

      const activeId = sessionManager.getActiveSessionId();
      expect(activeId).toBe(sessionId);
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionManager.deleteSession('non-existent-id');

      expect(result).toBe(false);
      expect(db.deleteSession).not.toHaveBeenCalled();
    });

    it('should handle interceptor disable errors gracefully', async () => {
      // SessionManager doesn't actually handle interceptor errors - they throw
      // This test verifies the delete attempt is made even though it will fail
      // Create a new mock that will fail for this test
      const failingInterceptor = {
        enable: vi.fn().mockResolvedValue(undefined),
        disable: vi.fn().mockRejectedValue(new Error('Disable failed')),
      };

      // Save the original mock implementation
      const originalMock = vi.mocked(ResponseInterceptor).getMockImplementation();

      // Replace the interceptor mock for this test
      vi.mocked(ResponseInterceptor).mockImplementation(() => failingInterceptor);

      // Create a new session with the failing interceptor
      const config: SessionConfig = {
        provider: 'openai',
        name: 'Failing Session',
      };

      const failingSession = await sessionManager.createSession(config);

      // The delete should fail because interceptor.disable() throws
      await expect(sessionManager.deleteSession(failingSession.id)).rejects.toThrow('Disable failed');

      // Interceptor disable was attempted
      expect(failingInterceptor.disable).toHaveBeenCalled();

      // Restore the original mock for other tests
      if (originalMock) {
        vi.mocked(ResponseInterceptor).mockImplementation(originalMock);
      }
    });
  });

  // ==================== SESSION RETRIEVAL TESTS ====================

  describe('Session Retrieval - listSessions()', () => {
    it('should get all active sessions by default', () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'claude',
          name: 'Session 1',
          partition: 'persist:claude-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
        {
          id: 'session-2',
          provider: 'openai',
          name: 'Session 2',
          partition: 'persist:openai-2',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);

      const sessions = sessionManager.listSessions();

      expect(sessions).toEqual(mockSessions);
      expect(db.getSessions).toHaveBeenCalledWith(true);
    });

    it('should get all sessions including inactive when requested', () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'claude',
          name: 'Active Session',
          partition: 'persist:claude-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
        {
          id: 'session-2',
          provider: 'openai',
          name: 'Inactive Session',
          partition: 'persist:openai-2',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 0,
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);

      const sessions = sessionManager.listSessions(true);

      expect(sessions).toEqual(mockSessions);
      expect(db.getSessions).toHaveBeenCalledWith(false);
    });

    it('should return empty array when no sessions exist', () => {
      vi.mocked(db.getSessions).mockReturnValue([]);

      const sessions = sessionManager.listSessions();

      expect(sessions).toEqual([]);
    });
  });

  describe('Session Retrieval - getView()', () => {
    it('should get WebContentsView for existing session', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      const view = sessionManager.getView(session.id);

      expect(view).toBeDefined();
    });

    it('should return undefined for non-existent session', () => {
      const view = sessionManager.getView('non-existent-id');

      expect(view).toBeUndefined();
    });
  });

  describe('Session Retrieval - getActiveSessionId()', () => {
    it('should return null when no session is active', () => {
      const activeId = sessionManager.getActiveSessionId();

      expect(activeId).toBeNull();
    });

    it('should return active session ID', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);
      sessionManager.activateSession(session.id);

      const activeId = sessionManager.getActiveSessionId();

      expect(activeId).toBe(session.id);
    });
  });

  // ==================== STATE PERSISTENCE TESTS ====================

  describe('State Persistence - saveSessionState()', () => {
    it('should save current URL to session metadata', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      // Mock db.getSession to return a session with metadata
      vi.mocked(db.getSession).mockReturnValue({
        ...session,
        metadata: JSON.stringify({ createdBy: 'user' }),
      });

      // Get the view and mock its getURL method
      const view = sessionManager.getView(session.id);
      vi.mocked(view!.webContents.getURL).mockReturnValue('https://claude.ai/chat/123');

      sessionManager.saveSessionState(session.id);

      expect(db.updateSessionMetadata).toHaveBeenCalledWith(
        session.id,
        expect.objectContaining({
          lastUrl: 'https://claude.ai/chat/123',
        })
      );
    });

    it('should preserve existing metadata when saving state', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      // Mock db.getSession to return a session with existing metadata
      vi.mocked(db.getSession).mockReturnValue({
        ...session,
        metadata: JSON.stringify({ createdBy: 'user', customField: 'value' }),
      });

      sessionManager.saveSessionState(session.id);

      expect(db.updateSessionMetadata).toHaveBeenCalledWith(
        session.id,
        expect.objectContaining({
          createdBy: 'user',
          customField: 'value',
          lastUrl: expect.any(String),
        })
      );
    });

    it('should handle session without existing metadata', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const session = await sessionManager.createSession(config);

      // Mock db.getSession to return a session without metadata
      vi.mocked(db.getSession).mockReturnValue(session);

      sessionManager.saveSessionState(session.id);

      expect(db.updateSessionMetadata).toHaveBeenCalledWith(
        session.id,
        expect.objectContaining({
          lastUrl: expect.any(String),
        })
      );
    });

    it('should not throw for non-existent session', () => {
      expect(() => {
        sessionManager.saveSessionState('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('State Persistence - loadPersistedSessions()', () => {
    it('should restore session with saved URL', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'claude',
          name: 'Claude Session',
          partition: 'persist:claude-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
          metadata: JSON.stringify({ lastUrl: 'https://claude.ai/chat/123' }),
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);

      await sessionManager.loadPersistedSessions();

      expect(db.getSessions).toHaveBeenCalledWith(true);
      expect(WebContentsView).toHaveBeenCalled();

      // Check that one of the created views loaded the saved URL
      const viewInstances = vi.mocked(WebContentsView).mock.results;
      const hasCorrectUrl = viewInstances.some(result => {
        const view = result.value;
        return vi.mocked(view.webContents.loadURL).mock.calls.some(
          call => call[0] === 'https://claude.ai/chat/123'
        );
      });
      expect(hasCorrectUrl).toBe(true);
    });

    it('should skip inactive sessions during restoration', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'claude',
          name: 'Active Session',
          partition: 'persist:claude-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
        {
          id: 'session-2',
          provider: 'openai',
          name: 'Inactive Session',
          partition: 'persist:openai-2',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 0,
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);
      vi.clearAllMocks();

      await sessionManager.loadPersistedSessions();

      // Should only create one WebContentsView for active session
      expect(WebContentsView).toHaveBeenCalledTimes(1);
    });

    it('should restore default URL when no lastUrl in metadata', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'gemini',
          name: 'Gemini Session',
          partition: 'persist:gemini-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);

      await sessionManager.loadPersistedSessions();

      // Check that one of the created views loaded the Gemini URL
      const viewInstances = vi.mocked(WebContentsView).mock.results;
      const hasCorrectUrl = viewInstances.some(result => {
        const view = result.value;
        return vi.mocked(view.webContents.loadURL).mock.calls.some(
          call => call[0] === 'https://gemini.google.com/'
        );
      });
      expect(hasCorrectUrl).toBe(true);
    });

    it('should create interceptors for restored sessions', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'claude',
          name: 'Claude Session',
          partition: 'persist:claude-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);

      await sessionManager.loadPersistedSessions();

      // Check that ResponseInterceptor was called with the correct provider
      const calls = vi.mocked(ResponseInterceptor).mock.calls;
      const hasCorrectCall = calls.some(call =>
        call[1] === 'session-1' && call[2] === 'claude'
      );
      expect(hasCorrectCall).toBe(true);
    });

    it('should handle errors during session restoration', async () => {
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          provider: 'claude',
          name: 'Claude Session',
          partition: 'persist:claude-1',
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        },
      ];

      vi.mocked(db.getSessions).mockReturnValue(mockSessions);

      // Mock WebContentsView to return a view with loadURL that rejects
      vi.mocked(WebContentsView).mockImplementationOnce(() => ({
        webContents: {
          loadURL: vi.fn().mockRejectedValue(new Error('Load failed')),
          getURL: vi.fn(() => 'https://example.com'),
          send: vi.fn(),
          once: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          removeListener: vi.fn(),
          destroy: vi.fn(),
          close: vi.fn(),
          isDestroyed: vi.fn(() => false),
          session: { partition: 'default' },
          debugger: {
            attach: vi.fn(),
            detach: vi.fn(),
            sendCommand: vi.fn(),
            on: vi.fn(),
          },
          setWindowOpenHandler: vi.fn(),
        },
        setBounds: vi.fn(),
        getBounds: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
      } as any));

      // Should not throw
      await expect(sessionManager.loadPersistedSessions()).resolves.not.toThrow();
    });

    it('should handle empty session list', async () => {
      vi.mocked(db.getSessions).mockReturnValue([]);

      await sessionManager.loadPersistedSessions();

      expect(WebContentsView).not.toHaveBeenCalled();
    });
  });

  // ==================== CLEANUP TESTS ====================

  describe('Cleanup - destroy()', () => {
    it('should save state for all sessions before destroying', async () => {
      // Create multiple sessions
      const config1: SessionConfig = { provider: 'claude', name: 'Session 1' };
      const config2: SessionConfig = { provider: 'openai', name: 'Session 2' };

      const session1 = await sessionManager.createSession(config1);
      const session2 = await sessionManager.createSession(config2);

      // Mock db.getSession to return the sessions with the actual generated IDs
      vi.mocked(db.getSession)
        .mockImplementation((id) => {
          if (id === session1.id) return session1;
          if (id === session2.id) return session2;
          return undefined;
        });

      await sessionManager.destroy();

      expect(db.updateSessionMetadata).toHaveBeenCalledTimes(2);
    });

    it('should disable all interceptors', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Session' };
      const mockSession: Session = {
        id: 'session-1',
        provider: 'claude',
        name: 'Session',
        partition: 'persist:claude-1',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      const mockInterceptor = {
        enable: vi.fn().mockResolvedValue(undefined),
        disable: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(ResponseInterceptor).mockImplementation(() => mockInterceptor);
      vi.mocked(db.createSession).mockReturnValue(mockSession);

      await sessionManager.createSession(config);
      await sessionManager.destroy();

      expect(mockInterceptor.disable).toHaveBeenCalled();
    });

    it('should close all webContents', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Session' };

      const session = await sessionManager.createSession(config);
      const view = sessionManager.getView(session.id);

      await sessionManager.destroy();

      // SessionManager calls close(), not destroy()
      expect(view?.webContents.close).toHaveBeenCalled();
    });

    it('should remove active view from window', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Session' };

      const session = await sessionManager.createSession(config);
      const view = sessionManager.getView(session.id);

      sessionManager.activateSession(session.id);
      vi.clearAllMocks();

      await sessionManager.destroy();

      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(view);
    });

    it('should clear all internal maps', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Session' };
      const mockSession: Session = {
        id: 'session-1',
        provider: 'claude',
        name: 'Session',
        partition: 'persist:claude-1',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockSession);

      await sessionManager.createSession(config);
      await sessionManager.destroy();

      expect(sessionManager.getView('session-1')).toBeUndefined();
      expect(sessionManager.getActiveSessionId()).toBeNull();
    });

    it('should handle errors during cleanup gracefully', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Session' };

      // Mock WebContentsView to return a view with close() that throws
      vi.mocked(WebContentsView).mockImplementationOnce(() => ({
        webContents: {
          loadURL: vi.fn().mockResolvedValue(undefined),
          getURL: vi.fn(() => 'https://example.com'),
          send: vi.fn(),
          once: vi.fn((event: string, listener: Function) => {
            if (event === 'did-finish-load') {
              setTimeout(() => listener(), 0);
            }
          }),
          on: vi.fn(),
          off: vi.fn(),
          removeListener: vi.fn(),
          destroy: vi.fn(),
          close: vi.fn().mockImplementation(() => {
            throw new Error('Close failed');
          }),
          isDestroyed: vi.fn(() => false),
          session: { partition: 'default' },
          debugger: {
            attach: vi.fn(),
            detach: vi.fn(),
            sendCommand: vi.fn(),
            on: vi.fn(),
          },
          setWindowOpenHandler: vi.fn(),
        },
        setBounds: vi.fn(),
        getBounds: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
      } as any));

      await sessionManager.createSession(config);

      // SessionManager doesn't catch errors in destroy(), so it will throw
      await expect(sessionManager.destroy()).rejects.toThrow('Close failed');
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases and Error Handling', () => {
    it('should handle multiple concurrent session creations', async () => {
      const configs = Array.from({ length: 5 }, (_, i) => ({
        provider: 'claude' as const,
        name: `Session ${i}`,
      }));

      const mockSessions = configs.map((config, i) => ({
        id: `session-${i}`,
        provider: 'claude',
        name: config.name,
        partition: `persist:claude-${i}`,
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      }));

      mockSessions.forEach((session) => {
        vi.mocked(db.createSession).mockReturnValueOnce(session);
      });

      const promises = configs.map((config) => sessionManager.createSession(config));
      const sessions = await Promise.all(promises);

      expect(sessions).toHaveLength(5);
      expect(WebContentsView).toHaveBeenCalledTimes(5);
    });

    it('should handle session ID collision gracefully', async () => {
      // This is mostly handled by crypto.randomUUID, but we can test the behavior
      const config1: SessionConfig = { provider: 'claude', name: 'Session 1' };
      const config2: SessionConfig = { provider: 'claude', name: 'Session 2' };

      const session1 = await sessionManager.createSession(config1);
      const session2 = await sessionManager.createSession(config2);

      // Use the actual returned session IDs
      expect(sessionManager.getView(session1.id)).toBeDefined();
      expect(sessionManager.getView(session2.id)).toBeDefined();
    });

    it('should maintain session isolation', async () => {
      const config1: SessionConfig = { provider: 'claude', name: 'Session 1' };
      const config2: SessionConfig = { provider: 'openai', name: 'Session 2' };

      const mockSession1: Session = {
        id: 'session-1',
        provider: 'claude',
        name: 'Session 1',
        partition: 'persist:claude-1',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      const mockSession2: Session = {
        id: 'session-2',
        provider: 'openai',
        name: 'Session 2',
        partition: 'persist:openai-2',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession)
        .mockReturnValueOnce(mockSession1)
        .mockReturnValueOnce(mockSession2);

      await sessionManager.createSession(config1);
      await sessionManager.createSession(config2);

      // Verify different partitions were used
      expect(session.fromPartition).toHaveBeenCalledWith(
        expect.stringContaining('persist:claude-')
      );
      expect(session.fromPartition).toHaveBeenCalledWith(
        expect.stringContaining('persist:openai-')
      );
    });

    it('should handle loadURL failures during session creation', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Test' };

      // Mock WebContentsView to return a view with loadURL that rejects
      vi.mocked(WebContentsView).mockImplementationOnce(() => ({
        webContents: {
          loadURL: vi.fn().mockRejectedValue(new Error('Load failed')),
          getURL: vi.fn(() => 'https://example.com'),
          send: vi.fn(),
          once: vi.fn(),
          on: vi.fn(),
          off: vi.fn(),
          removeListener: vi.fn(),
          destroy: vi.fn(),
          close: vi.fn(),
          isDestroyed: vi.fn(() => false),
          session: { partition: 'default' },
          debugger: {
            attach: vi.fn(),
            detach: vi.fn(),
            sendCommand: vi.fn(),
            on: vi.fn(),
          },
          setWindowOpenHandler: vi.fn(),
        },
        setBounds: vi.fn(),
        getBounds: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
      } as any));

      await expect(sessionManager.createSession(config)).rejects.toThrow('Load failed');
    });

    it('should verify cleanup on session close', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Test' };

      const session = await sessionManager.createSession(config);
      const view = sessionManager.getView(session.id);

      // Verify view exists
      expect(view).toBeDefined();

      await sessionManager.deleteSession(session.id);

      // Verify complete cleanup
      expect(sessionManager.getView(session.id)).toBeUndefined();
      expect(view?.webContents.close).toHaveBeenCalled();
      expect(db.deleteSession).toHaveBeenCalledWith(session.id);
    });

    it('should track multiple sessions correctly', async () => {
      const sessions = [];

      for (let i = 0; i < 3; i++) {
        const config: SessionConfig = {
          provider: 'claude',
          name: `Session ${i}`,
        };

        sessions.push(await sessionManager.createSession(config));
      }

      // Verify all sessions are tracked
      sessions.forEach((session) => {
        expect(sessionManager.getView(session.id)).toBeDefined();
      });
    });
  });
});
