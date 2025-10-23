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
   * Enforces one session per provider constraint
   */
  async createSession(config: SessionConfig): Promise<Session> {
    // Check if session for this provider already exists
    const existingSessions = db.getSessions(true);
    const existingProviderSession = existingSessions.find(s => s.provider === config.provider);

    if (existingProviderSession) {
      console.log(`[SessionManager] Session for ${config.provider} already exists: ${existingProviderSession.id}`);
      console.log(`[SessionManager] Returning existing session instead of creating new one`);
      return existingProviderSession;
    }

    const sessionId = randomUUID();
    const partition = `persist:${config.provider}-${sessionId}`;

    console.log(`[SessionManager] Creating new session: ${sessionId} for ${config.provider}`);

    // Create database entry first
    const dbSession = db.createSession({
      id: sessionId,
      session_type: 'provider',
      provider: config.provider,
      name: config.name,
      partition: partition,
      url: config.url || PROVIDER_URLS[config.provider],
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

    // Listen for browser notifications to detect deep research completion
    view.webContents.on('did-create-notification', (_event, notification) => {
      const title = notification.title.toLowerCase();
      const body = notification.body?.toLowerCase() || '';

      console.log(`[SessionManager] Notification detected: "${notification.title}"`);

      // Check if this is a deep research completion notification
      const isDeepResearchComplete =
        title.includes('research complete') ||
        title.includes('research finished') ||
        body.includes('research complete') ||
        body.includes('research finished') ||
        body.includes('researching your question') ||
        (title.includes('claude') && (body.includes('complete') || body.includes('finished')));

      if (isDeepResearchComplete) {
        console.log(`[SessionManager] 🔬 Deep research completion detected! Auto-capturing page...`);

        // Wait a moment for any final UI updates, then auto-capture
        setTimeout(async () => {
          try {
            const success = await this.captureCurrentPage(sessionId);
            if (success) {
              console.log(`[SessionManager] ✓ Auto-capture successful for session ${sessionId}`);

              // Notify the UI that a new capture was created
              const allWindows = BrowserWindow.getAllWindows();
              for (const window of allWindows) {
                window.webContents.send('capture:auto-created', { sessionId });
              }
            } else {
              console.error(`[SessionManager] ✗ Auto-capture failed for session ${sessionId}`);
            }
          } catch (error) {
            console.error(`[SessionManager] Error during auto-capture:`, error);
          }
        }, 2000); // Wait 2 seconds for UI to fully update
      }
    });

    // Load URL after registering the event listener
    await view.webContents.loadURL(initialUrl);

    console.log(`[SessionManager] Session created successfully: ${sessionId}`);

    // Broadcast session:created event to all windows for auto-refresh
    const allWindows = BrowserWindow.getAllWindows();
    for (const window of allWindows) {
      window.webContents.send('session:created', {
        sessionId: dbSession.id,
        provider: dbSession.provider,
        name: dbSession.name
      });
    }

    return dbSession;
  }

  /**
   * Activate a session (use visibility instead of remove/add)
   * Note: Bounds are now controlled by the renderer via IPC
   */
  activateSession(sessionId: string): boolean {
    // Check if this is a capture session (no WebContentsView)
    const dbSession = db.getSession(sessionId);
    if (dbSession && dbSession.session_type === 'capture') {
      console.log(`[SessionManager] Activating capture session (no view): ${sessionId}`);
      // Capture sessions don't have views, just update database
      db.updateSessionActivity(sessionId);
      return true;
    }

    // Provider session - has WebContentsView
    const view = this.views.get(sessionId);

    if (!view) {
      console.error(`[SessionManager] Provider session ${sessionId} not found in views map`);
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

    console.log(`[SessionManager] Activated provider session: ${sessionId}`);

    return true;
  }

  /**
   * Delete a session and its WebContentsView
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    console.log(`[SessionManager] Deleting session: ${sessionId}`);

    // Check if this is a capture session (no WebContentsView)
    const dbSession = db.getSession(sessionId);
    if (dbSession && dbSession.session_type === 'capture') {
      console.log(`[SessionManager] Deleting capture session (no view): ${sessionId}`);
      // Capture sessions don't have views, just delete from database
      db.deleteSession(sessionId);
      console.log(`[SessionManager] Capture session deleted: ${sessionId}`);

      // Broadcast session:deleted event to all windows for auto-refresh
      const allWindows = BrowserWindow.getAllWindows();
      for (const window of allWindows) {
        window.webContents.send('session:deleted', {
          sessionId: sessionId
        });
      }

      return true;
    }

    // Provider session - has WebContentsView
    const view = this.views.get(sessionId);

    if (!view) {
      console.error(`[SessionManager] Provider session ${sessionId} not found in views map`);
      // Still try to delete from database in case of orphaned record
      db.deleteSession(sessionId);
      return false;
    }

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

    console.log(`[SessionManager] Provider session deleted: ${sessionId}`);

    // Broadcast session:deleted event to all windows for auto-refresh
    const allWindows = BrowserWindow.getAllWindows();
    for (const window of allWindows) {
      window.webContents.send('session:deleted', {
        sessionId: sessionId
      });
    }

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

      // Skip capture sessions - they don't have WebContentsViews
      if (session.session_type === 'capture') {
        console.log(`[SessionManager] Skipping capture session (no view needed): ${session.id}`);
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

        // Listen for browser notifications to detect deep research completion
        view.webContents.on('did-create-notification', (_event, notification) => {
          const title = notification.title.toLowerCase();
          const body = notification.body?.toLowerCase() || '';

          console.log(`[SessionManager] Notification detected on restored session: "${notification.title}"`);

          // Check if this is a deep research completion notification
          const isDeepResearchComplete =
            title.includes('research complete') ||
            title.includes('research finished') ||
            body.includes('research complete') ||
            body.includes('research finished') ||
            body.includes('researching your question') ||
            (title.includes('claude') && (body.includes('complete') || body.includes('finished')));

          if (isDeepResearchComplete) {
            console.log(`[SessionManager] 🔬 Deep research completion detected! Auto-capturing page...`);

            // Wait a moment for any final UI updates, then auto-capture
            setTimeout(async () => {
              try {
                const success = await this.captureCurrentPage(session.id);
                if (success) {
                  console.log(`[SessionManager] ✓ Auto-capture successful for restored session ${session.id}`);

                  // Notify the UI that a new capture was created
                  const allWindows = BrowserWindow.getAllWindows();
                  for (const window of allWindows) {
                    window.webContents.send('capture:auto-created', { sessionId: session.id });
                  }
                } else {
                  console.error(`[SessionManager] ✗ Auto-capture failed for restored session ${session.id}`);
                }
              } catch (error) {
                console.error(`[SessionManager] Error during auto-capture:`, error);
              }
            }, 2000); // Wait 2 seconds for UI to fully update
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
