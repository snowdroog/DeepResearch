/**
 * SessionManager - Manages multiple AI provider sessions using WebContentsView
 *
 * Features:
 * - Creates isolated WebContentsView instances with separate partitions
 * - Supports multiple concurrent provider sessions (Claude, OpenAI, Gemini)
 * - Manages session lifecycle (create, activate, delete)
 * - Integrates with database for persistence
 */

import { WebContentsView, BrowserWindow, session } from 'electron';
import { randomUUID } from 'crypto';
import { db, Session } from '../database/db.js';
import { ResponseInterceptor } from '../capture/ResponseInterceptor.js';

export interface SessionConfig {
  provider: 'claude' | 'openai' | 'gemini' | 'custom';
  name: string;
  url?: string; // Optional initial URL to load
}

const PROVIDER_URLS: Record<string, string> = {
  claude: 'https://claude.ai/new',
  openai: 'https://chat.openai.com/',
  gemini: 'https://gemini.google.com/',
  custom: 'about:blank'
};

export class SessionManager {
  private views: Map<string, WebContentsView> = new Map();
  private interceptors: Map<string, ResponseInterceptor> = new Map();
  private resizeHandlers: Map<string, () => void> = new Map();
  private activeSessionId: string | null = null;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Create a new session with isolated partition
   */
  async createSession(config: SessionConfig): Promise<Session> {
    const sessionId = randomUUID();
    const partition = `persist:${config.provider}-${sessionId}`;

    console.log(`[SessionManager] Creating session: ${sessionId} for ${config.provider}`);

    // Create database entry first
    const dbSession = db.createSession({
      id: sessionId,
      provider: config.provider,
      name: config.name,
      partition: partition,
      metadata: JSON.stringify({
        createdBy: 'user',
        initialUrl: config.url || PROVIDER_URLS[config.provider]
      })
    });

    // Create WebContentsView with isolated partition
    const view = new WebContentsView({
      webPreferences: {
        partition: partition,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        // Enable content script injection for response capture
        preload: undefined // Will be set per-session if needed
      }
    });

    // Configure session-specific settings
    const electronSession = session.fromPartition(partition);

    // Set user agent to avoid detection
    electronSession.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Note: Persistent storage is automatically handled by the partition name (persist:...)

    // Store view instance
    this.views.set(sessionId, view);

    // Create response interceptor
    const interceptor = new ResponseInterceptor(
      view.webContents,
      sessionId,
      config.provider
    );
    this.interceptors.set(sessionId, interceptor);

    // Load initial URL
    const initialUrl = config.url || PROVIDER_URLS[config.provider];
    console.log(`[SessionManager] Loading URL for session ${sessionId}: ${initialUrl}`);

    // Set up page load event listeners for debugging
    view.webContents.on('did-start-loading', () => {
      console.log(`[SessionManager] Page started loading for session ${sessionId}`);
    });

    view.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error(`[SessionManager] Page failed to load for session ${sessionId}: ${errorCode} - ${errorDescription}`);
    });

    // IMPORTANT: Register did-finish-load listener BEFORE calling loadURL to avoid race condition
    view.webContents.once('did-finish-load', async () => {
      console.log(`[SessionManager] did-finish-load event fired for session ${sessionId}`);
      try {
        console.log(`[SessionManager] Attempting to enable interceptor for session ${sessionId}...`);
        await interceptor.enable();
        console.log(`[SessionManager] ✓ Interceptor enabled successfully for session ${sessionId}`);
      } catch (error) {
        console.error(`[SessionManager] ✗ Failed to enable interceptor for ${sessionId}:`, error);
      }
    });

    // Load URL after registering the event listener
    await view.webContents.loadURL(initialUrl);

    console.log(`[SessionManager] Session created successfully: ${sessionId}`);

    return dbSession;
  }

  /**
   * Activate a session (use visibility instead of remove/add)
   * Note: Bounds are now controlled by the renderer via IPC
   */
  activateSession(sessionId: string): boolean {
    const view = this.views.get(sessionId);

    if (!view) {
      console.error(`[SessionManager] Session ${sessionId} not found`);
      return false;
    }

    // Hide current view if any
    if (this.activeSessionId) {
      const currentView = this.views.get(this.activeSessionId);
      if (currentView) {
        currentView.setVisible(false);
        console.log(`[SessionManager] Hidden session: ${this.activeSessionId}`);
      }
    }

    // Ensure view is added to window
    const childViews = this.mainWindow.contentView.children;
    if (!childViews.includes(view)) {
      this.mainWindow.contentView.addChildView(view);
      console.log(`[SessionManager] Added view to window for session: ${sessionId}`);
    }

    // Show the view
    view.setVisible(true);

    this.activeSessionId = sessionId;

    // Update last_active in database
    db.updateSessionActivity(sessionId);

    console.log(`[SessionManager] Activated session: ${sessionId}`);

    return true;
  }

  /**
   * Delete a session and its WebContentsView
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const view = this.views.get(sessionId);

    if (!view) {
      console.error(`[SessionManager] Session ${sessionId} not found`);
      return false;
    }

    console.log(`[SessionManager] Deleting session: ${sessionId}`);

    // Disable interceptor
    const interceptor = this.interceptors.get(sessionId);
    if (interceptor) {
      await interceptor.disable();
      this.interceptors.delete(sessionId);
    }

    // Remove from window if currently active
    if (this.activeSessionId === sessionId) {
      this.mainWindow.contentView.removeChildView(view);
      this.activeSessionId = null;
      // Remove resize handler
      const resizeHandler = this.resizeHandlers.get(sessionId);
      if (resizeHandler) {
        this.mainWindow.off('resize', resizeHandler);
        this.resizeHandlers.delete(sessionId);
      }
    }

    // Close webContents before destroying to prevent memory leaks
    view.webContents.close();

    // Remove from map
    this.views.delete(sessionId);

    // Delete from database (CASCADE will delete associated captures)
    db.deleteSession(sessionId);

    console.log(`[SessionManager] Session deleted: ${sessionId}`);

    return true;
  }

  /**
   * Get list of all sessions from database
   */
  listSessions(includeInactive = false): Session[] {
    return db.getSessions(!includeInactive);
  }

  /**
   * Get active session ID
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  /**
   * Get WebContentsView for a session
   */
  getView(sessionId: string): WebContentsView | undefined {
    return this.views.get(sessionId);
  }

  /**
   * Load existing sessions from database on startup
   */
  async loadPersistedSessions(): Promise<void> {
    console.log('[SessionManager] Loading persisted sessions from database...');

    const sessions = db.getSessions(true); // Include all sessions

    for (const session of sessions) {
      if (!session.is_active) {
        console.log(`[SessionManager] Skipping inactive session: ${session.id}`);
        continue;
      }

      console.log(`[SessionManager] Restoring session: ${session.id} (${session.provider})`);

      try {
        // Create WebContentsView with existing partition
        const view = new WebContentsView({
          webPreferences: {
            partition: session.partition,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true
          }
        });

        // Get session metadata to restore URL
        const metadata = session.metadata ? JSON.parse(session.metadata) : {};
        const lastUrl = metadata.lastUrl || PROVIDER_URLS[session.provider];

        console.log(`[SessionManager] Loading URL for restored session ${session.id}: ${lastUrl}`);

        // Set up page load event listeners for debugging
        view.webContents.on('did-start-loading', () => {
          console.log(`[SessionManager] Page started loading for restored session ${session.id}`);
        });

        view.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
          console.error(`[SessionManager] Page failed to load for restored session ${session.id}: ${errorCode} - ${errorDescription}`);
        });

        // Create and enable interceptor
        const interceptor = new ResponseInterceptor(
          view.webContents,
          session.id,
          session.provider
        );
        this.interceptors.set(session.id, interceptor);

        // IMPORTANT: Register did-finish-load listener BEFORE calling loadURL to avoid race condition
        view.webContents.once('did-finish-load', async () => {
          console.log(`[SessionManager] did-finish-load event fired for restored session ${session.id}`);
          try {
            console.log(`[SessionManager] Attempting to enable interceptor for restored session ${session.id}...`);
            await interceptor.enable();
            console.log(`[SessionManager] ✓ Interceptor enabled successfully for restored session ${session.id}`);
          } catch (error) {
            console.error(`[SessionManager] ✗ Failed to enable interceptor for restored session ${session.id}:`, error);
          }
        });

        // Load last URL after registering the event listener
        await view.webContents.loadURL(lastUrl);

        // Store view
        this.views.set(session.id, view);

        console.log(`[SessionManager] Restored session: ${session.id}`);
      } catch (error) {
        console.error(`[SessionManager] Failed to restore session ${session.id}:`, error);
      }
    }

    console.log(`[SessionManager] Loaded ${this.views.size} sessions`);
  }

  /**
   * Save current URL for a session (for restoration on restart)
   */
  saveSessionState(sessionId: string): void {
    const view = this.views.get(sessionId);
    const dbSession = db.getSession(sessionId);

    if (!view || !dbSession) return;

    const metadata = dbSession.metadata ? JSON.parse(dbSession.metadata) : {};
    metadata.lastUrl = view.webContents.getURL();

    // Update metadata in database
    db.updateSessionMetadata(sessionId, metadata);
    console.log(`[SessionManager] Saved state for session: ${sessionId}`);
  }

  /**
   * Clean up all sessions on shutdown
   */
  async destroy(): Promise<void> {
    console.log('[SessionManager] Cleaning up all sessions...');

    for (const [sessionId, view] of this.views) {
      // Disable interceptor
      const interceptor = this.interceptors.get(sessionId);
      if (interceptor) {
        await interceptor.disable();
      }

      // Save state before destroying
      this.saveSessionState(sessionId);

      // Remove from window
      if (this.activeSessionId === sessionId) {
        this.mainWindow.contentView.removeChildView(view);
      }

      // Remove resize handler
      const resizeHandler = this.resizeHandlers.get(sessionId);
      if (resizeHandler) {
        this.mainWindow.off('resize', resizeHandler);
      }

      // Close webContents before destroying to prevent memory leaks
      view.webContents.close();
    }

    this.views.clear();
    this.interceptors.clear();
    this.resizeHandlers.clear();
    this.activeSessionId = null;

    console.log('[SessionManager] Cleanup complete');
  }
}
