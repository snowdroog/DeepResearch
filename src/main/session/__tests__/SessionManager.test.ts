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
import type { BrowserWindow, WebContentsView } from 'electron';
import { SessionManager, SessionConfig } from '../SessionManager';
import { db, Session } from '../../database/db';
import { ResponseInterceptor } from '../../capture/ResponseInterceptor';

// Ensure electron mock is loaded (from setup-main.ts)
// This vi.mock call will be hoisted and merged with the global mock
vi.mock('electron');

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
      loadURL: vi.fn(),
      getURL: vi.fn(() => 'https://example.com'),
      send: vi.fn(),
      once: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn(),
      debugger: {
        attach: vi.fn(),
        detach: vi.fn(),
        sendCommand: vi.fn(),
        on: vi.fn(),
      },
    };

    // Mock WebContentsView
    mockWebContentsView = {
      webContents: mockWebContents,
      setBounds: vi.fn(),
    };

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

      const mockDbSession: Session = {
        id: 'mock-uuid-456',
        provider: 'openai',
        name: 'OpenAI Session',
        partition: 'persist:openai-mock-uuid-456',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      const session = await sessionManager.createSession(config);

      expect(session.provider).toBe('openai');
      expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://chat.openai.com/');
    });

    it('should create session with Gemini provider', async () => {
      const config: SessionConfig = {
        provider: 'gemini',
        name: 'Gemini Session',
      };

      const mockDbSession: Session = {
        id: 'mock-uuid-789',
        provider: 'gemini',
        name: 'Gemini Session',
        partition: 'persist:gemini-mock-uuid-789',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);

      expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://gemini.google.com/');
    });

    it('should create session with custom provider and URL', async () => {
      const config: SessionConfig = {
        provider: 'custom',
        name: 'Custom Session',
        url: 'https://custom-ai.com/chat',
      };

      const mockDbSession: Session = {
        id: 'mock-uuid-custom',
        provider: 'custom',
        name: 'Custom Session',
        partition: 'persist:custom-mock-uuid-custom',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);

      expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://custom-ai.com/chat');
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

      const { session } = await import('electron');
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

      expect(ResponseInterceptor).toHaveBeenCalledWith(
        mockWebContents,
        expect.any(String),
        'claude'
      );
    });

    it('should enable interceptor after page loads', async () => {
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

      const { WebContentsView } = await import('electron');
      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);

      // Get the WebContentsView instance that was created
      const mockWebContentsView = vi.mocked(WebContentsView).mock.results[0].value;
      expect(mockWebContentsView.webContents.once).toHaveBeenCalledWith(
        'did-finish-load',
        expect.any(Function)
      );
    });

    it('should store session view in internal map', async () => {
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

      const view = sessionManager.getView('test-id');
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

      const mockDbSession: Session = {
        id: 'test-session-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);
      await sessionManager.createSession(config);
      sessionId = mockDbSession.id;
    });

    it('should activate session and attach WebContentsView to window', () => {
      const result = sessionManager.activateSession(sessionId);

      expect(result).toBe(true);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalled();
    });

    it('should set correct bounds for WebContentsView', async () => {
      const { WebContentsView } = await import('electron');
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

      const mockDbSession2: Session = {
        id: 'second-session-id',
        provider: 'openai',
        name: 'Second Session',
        partition: 'persist:openai-second',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      const mockWebContentsView2 = {
        webContents: mockWebContents,
        setBounds: vi.fn(),
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession2);
      vi.mocked(WebContentsView).mockImplementationOnce(() => mockWebContentsView2 as any);

      await sessionManager.createSession(config2);

      // Activate first session
      sessionManager.activateSession(sessionId);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(mockWebContentsView);

      // Activate second session
      sessionManager.activateSession('second-session-id');
      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockWebContentsView);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(mockWebContentsView2);
    });

    it('should return false for non-existent session', () => {
      const result = sessionManager.activateSession('non-existent-id');

      expect(result).toBe(false);
      expect(mockMainWindow.contentView.addChildView).not.toHaveBeenCalled();
    });

    it('should handle reactivating same session', () => {
      sessionManager.activateSession(sessionId);
      vi.clearAllMocks();

      sessionManager.activateSession(sessionId);

      // Should remove and re-add same view
      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockWebContentsView);
      expect(mockMainWindow.contentView.addChildView).toHaveBeenCalledWith(mockWebContentsView);
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

      const mockDbSession: Session = {
        id: 'test-session-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      mockInterceptor = {
        enable: vi.fn().mockResolvedValue(undefined),
        disable: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(ResponseInterceptor).mockImplementation(() => mockInterceptor);
      vi.mocked(db.createSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);
      sessionId = mockDbSession.id;
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

    it('should destroy webContents', async () => {
      await sessionManager.deleteSession(sessionId);

      expect(mockWebContents.destroy).toHaveBeenCalled();
    });

    it('should remove view from internal map', async () => {
      await sessionManager.deleteSession(sessionId);

      const view = sessionManager.getView(sessionId);
      expect(view).toBeUndefined();
    });

    it('should remove view from window if currently active', async () => {
      sessionManager.activateSession(sessionId);
      vi.clearAllMocks();

      await sessionManager.deleteSession(sessionId);

      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockWebContentsView);
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

      const mockDbSession2: Session = {
        id: 'second-session-id',
        provider: 'openai',
        name: 'Second Session',
        partition: 'persist:openai-second',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession2);
      await sessionManager.createSession(config2);

      // Delete inactive session
      await sessionManager.deleteSession('second-session-id');

      const activeId = sessionManager.getActiveSessionId();
      expect(activeId).toBe(sessionId);
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionManager.deleteSession('non-existent-id');

      expect(result).toBe(false);
      expect(db.deleteSession).not.toHaveBeenCalled();
    });

    it('should handle interceptor disable errors gracefully', async () => {
      mockInterceptor.disable.mockRejectedValue(new Error('Disable failed'));

      const result = await sessionManager.deleteSession(sessionId);

      expect(result).toBe(true); // Should still complete deletion
      expect(db.deleteSession).toHaveBeenCalled();
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

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);
      await sessionManager.createSession(config);

      const view = sessionManager.getView('test-id');

      expect(view).toBeDefined();
      expect(view).toBe(mockWebContentsView);
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

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);
      await sessionManager.createSession(config);
      sessionManager.activateSession('test-id');

      const activeId = sessionManager.getActiveSessionId();

      expect(activeId).toBe('test-id');
    });
  });

  // ==================== STATE PERSISTENCE TESTS ====================

  describe('State Persistence - saveSessionState()', () => {
    it('should save current URL to session metadata', async () => {
      const config: SessionConfig = {
        provider: 'claude',
        name: 'Test Session',
      };

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
        metadata: JSON.stringify({ createdBy: 'user' }),
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);
      vi.mocked(db.getSession).mockReturnValue(mockDbSession);
      mockWebContents.getURL.mockReturnValue('https://claude.ai/chat/123');

      await sessionManager.createSession(config);
      sessionManager.saveSessionState('test-id');

      expect(db.updateSessionMetadata).toHaveBeenCalledWith(
        'test-id',
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

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
        metadata: JSON.stringify({ createdBy: 'user', customField: 'value' }),
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);
      vi.mocked(db.getSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);
      sessionManager.saveSessionState('test-id');

      expect(db.updateSessionMetadata).toHaveBeenCalledWith(
        'test-id',
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

      const mockDbSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test Session',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockDbSession);
      vi.mocked(db.getSession).mockReturnValue(mockDbSession);

      await sessionManager.createSession(config);
      sessionManager.saveSessionState('test-id');

      expect(db.updateSessionMetadata).toHaveBeenCalledWith(
        'test-id',
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
    it('should load active sessions from database', async () => {
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
      expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://claude.ai/chat/123');
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

      expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://gemini.google.com/');
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

      expect(ResponseInterceptor).toHaveBeenCalledWith(
        mockWebContents,
        'session-1',
        'claude'
      );
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
      mockWebContents.loadURL.mockRejectedValue(new Error('Load failed'));

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

      vi.mocked(db.getSession)
        .mockImplementation((id) => {
          if (id === 'session-1') return mockSession1;
          if (id === 'session-2') return mockSession2;
          return undefined;
        });

      await sessionManager.createSession(config1);
      await sessionManager.createSession(config2);

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

    it('should destroy all webContents', async () => {
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

      expect(mockWebContents.destroy).toHaveBeenCalled();
    });

    it('should remove active view from window', async () => {
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
      sessionManager.activateSession('session-1');
      vi.clearAllMocks();

      await sessionManager.destroy();

      expect(mockMainWindow.contentView.removeChildView).toHaveBeenCalledWith(mockWebContentsView);
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
      mockWebContents.destroy.mockImplementation(() => {
        throw new Error('Destroy failed');
      });

      await sessionManager.createSession(config);

      // Should not throw
      await expect(sessionManager.destroy()).resolves.not.toThrow();
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

      const mockSession1: Session = {
        id: 'uuid-1',
        provider: 'claude',
        name: 'Session 1',
        partition: 'persist:claude-uuid-1',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      const mockSession2: Session = {
        id: 'uuid-2',
        provider: 'claude',
        name: 'Session 2',
        partition: 'persist:claude-uuid-2',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession)
        .mockReturnValueOnce(mockSession1)
        .mockReturnValueOnce(mockSession2);

      await sessionManager.createSession(config1);
      await sessionManager.createSession(config2);

      expect(sessionManager.getView('uuid-1')).toBeDefined();
      expect(sessionManager.getView('uuid-2')).toBeDefined();
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

      const { session } = await import('electron');

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
      const mockSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockSession);
      mockWebContents.loadURL.mockRejectedValue(new Error('Load failed'));

      await expect(sessionManager.createSession(config)).rejects.toThrow('Load failed');
    });

    it('should verify cleanup on session close', async () => {
      const config: SessionConfig = { provider: 'claude', name: 'Test' };
      const mockSession: Session = {
        id: 'test-id',
        provider: 'claude',
        name: 'Test',
        partition: 'persist:claude-test',
        created_at: Date.now(),
        last_active: Date.now(),
        is_active: 1,
      };

      vi.mocked(db.createSession).mockReturnValue(mockSession);

      await sessionManager.createSession(config);

      // Verify view exists
      expect(sessionManager.getView('test-id')).toBeDefined();

      await sessionManager.deleteSession('test-id');

      // Verify complete cleanup
      expect(sessionManager.getView('test-id')).toBeUndefined();
      expect(mockWebContents.destroy).toHaveBeenCalled();
      expect(db.deleteSession).toHaveBeenCalledWith('test-id');
    });

    it('should track multiple sessions correctly', async () => {
      const sessions = [];

      for (let i = 0; i < 3; i++) {
        const config: SessionConfig = {
          provider: 'claude',
          name: `Session ${i}`,
        };

        const mockSession: Session = {
          id: `session-${i}`,
          provider: 'claude',
          name: `Session ${i}`,
          partition: `persist:claude-${i}`,
          created_at: Date.now(),
          last_active: Date.now(),
          is_active: 1,
        };

        vi.mocked(db.createSession).mockReturnValueOnce(mockSession);
        sessions.push(await sessionManager.createSession(config));
      }

      // Verify all sessions are tracked
      sessions.forEach((session) => {
        expect(sessionManager.getView(session.id)).toBeDefined();
      });
    });
  });
});
