/**
 * SQLite Database Service
 * Handles database initialization, queries, and CRUD operations
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface Session {
  id: string;
  session_type: 'provider' | 'capture';
  provider?: string;
  name: string;
  partition?: string;
  capture_id?: string;
  url?: string;
  created_at: number;
  last_active: number;
  is_active: number;
  metadata?: string;
}

export interface Capture {
  id: string;
  session_id: string;
  provider: string;
  prompt: string;
  response: string;
  response_format?: string;
  model?: string;
  timestamp: number;
  token_count?: number;
  tags?: string;
  notes?: string;
  is_archived: number;
  // Enhanced metadata (v1.1)
  message_type?: 'chat' | 'deep_research' | 'image' | 'code';
  topic?: string;
  metadata_json?: string;
  // Thread tracking (v1.2)
  conversation_id?: string;
}

export interface SearchFilters {
  provider?: string;
  startDate?: number;
  endDate?: number;
  isArchived?: boolean;
  messageType?: 'chat' | 'deep_research' | 'image' | 'code';
  topic?: string;
}

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in user's app data directory
    const userDataPath = app.getPath('userData');
    const dataDir = path.join(userDataPath, 'data');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = path.join(dataDir, 'deepresearch.db');
  }

  /**
   * Initialize database connection and schema
   */
  initialize(): void {
    console.log('[DB] Initializing database at:', this.dbPath);

    // Open database with optimizations
    this.db = new Database(this.dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Load and execute schema
    this.loadSchema();

    console.log('[DB] Database initialized successfully');
  }

  /**
   * Load SQL schema from file
   */
  private loadSchema(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Use a simple path relative to the process cwd for the compiled code
    const schemaPath = path.join(process.cwd(), 'dist', 'main', 'database', 'schema.sql');

    console.log('[DB] Loading schema from:', schemaPath);
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema (handles CREATE TABLE IF NOT EXISTS)
    this.db.exec(schema);

    // Run migrations
    this.runMigrations();
  }

  /**
   * Run database migrations
   */
  private runMigrations(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `);

    // Check current schema version
    const result = this.db.prepare('SELECT MAX(version) as version FROM schema_migrations').get() as { version: number | null };
    const currentVersion = result?.version || 0;

    console.log('[DB] Current schema version:', currentVersion);

    // Migration 1: Add enhanced metadata fields
    if (currentVersion < 1) {
      console.log('[DB] Running migration 1: Add enhanced metadata fields');
      try {
        // Check if columns already exist before adding them
        const tableInfo = this.db.prepare("PRAGMA table_info(captures)").all() as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);

        if (!columnNames.includes('message_type')) {
          this.db.exec(`ALTER TABLE captures ADD COLUMN message_type TEXT DEFAULT 'chat' CHECK(message_type IN ('chat', 'deep_research', 'image', 'code'))`);
        }
        if (!columnNames.includes('topic')) {
          this.db.exec(`ALTER TABLE captures ADD COLUMN topic TEXT`);
        }
        if (!columnNames.includes('metadata_json')) {
          this.db.exec(`ALTER TABLE captures ADD COLUMN metadata_json TEXT`);
        }

        // Create indexes
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_captures_message_type ON captures(message_type)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_captures_topic ON captures(topic)`);

        // Mark migration as applied
        this.db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(1, Date.now());
        console.log('[DB] Migration 1 completed successfully');
      } catch (error) {
        console.error('[DB] Migration 1 failed:', error);
        throw error;
      }
    }

    // Migration 2: Add capture session support
    if (currentVersion < 2) {
      console.log('[DB] Running migration 2: Add capture session support');
      try {
        // Check if provider field is nullable (if not, we need to recreate the table)
        const tableInfo = this.db.prepare("PRAGMA table_info(sessions)").all() as Array<{ name: string; notnull: number }>;
        const providerCol = tableInfo.find(col => col.name === 'provider');
        const needsRecreation = providerCol && providerCol.notnull === 1;

        if (needsRecreation) {
          // SQLite doesn't support changing column constraints, so we need to recreate the table
          console.log('[DB] Recreating sessions table with nullable provider field...');

          // CRITICAL: Disable foreign keys during table recreation to prevent cascade deletes
          this.db.exec(`PRAGMA foreign_keys = OFF`);

          // Step 1: Rename existing table
          this.db.exec(`ALTER TABLE sessions RENAME TO sessions_old`);

          // Step 2: Create new table with correct schema
          this.db.exec(`
            CREATE TABLE sessions (
              id TEXT PRIMARY KEY,
              session_type TEXT NOT NULL DEFAULT 'provider',
              provider TEXT,
              name TEXT NOT NULL,
              partition TEXT UNIQUE,
              capture_id TEXT,
              url TEXT,
              created_at INTEGER NOT NULL,
              last_active INTEGER NOT NULL,
              is_active INTEGER DEFAULT 1,
              metadata TEXT,
              FOREIGN KEY (capture_id) REFERENCES captures(id) ON DELETE CASCADE
            )
          `);

          // Step 3: Copy data from old table, setting session_type for existing rows
          this.db.exec(`
            INSERT INTO sessions (id, session_type, provider, name, partition, capture_id, url, created_at, last_active, is_active, metadata)
            SELECT id, 'provider' as session_type, provider, name, partition, NULL as capture_id, NULL as url, created_at, last_active, is_active, metadata
            FROM sessions_old
          `);

          // Step 4: Drop old table
          this.db.exec(`DROP TABLE sessions_old`);

          // Step 5: Recreate indexes
          this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_provider ON sessions(provider)`);
          this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)`);
          this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_capture_id ON sessions(capture_id)`);
          this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type)`);

          // Step 6: Re-enable foreign keys
          this.db.exec(`PRAGMA foreign_keys = ON`);

          console.log('[DB] Sessions table recreated successfully');
        }

        // Mark migration as applied
        this.db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(2, Date.now());
        console.log('[DB] Migration 2 completed successfully');
      } catch (error) {
        console.error('[DB] Migration 2 failed:', error);
        throw error;
      }
    }

    // Migration 3: Add conversation thread tracking
    if (currentVersion < 3) {
      console.log('[DB] Running migration 3: Add conversation thread tracking');
      try {
        // Check if conversation_id column already exists
        const tableInfo = this.db.prepare("PRAGMA table_info(captures)").all() as Array<{ name: string }>;
        const columnNames = tableInfo.map(col => col.name);

        if (!columnNames.includes('conversation_id')) {
          this.db.exec(`ALTER TABLE captures ADD COLUMN conversation_id TEXT`);
        }

        // Create indexes for efficient conversation queries
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_captures_conversation ON captures(conversation_id)`);
        this.db.exec(`CREATE INDEX IF NOT EXISTS idx_captures_conversation_timestamp ON captures(conversation_id, timestamp)`);

        // Mark migration as applied
        this.db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(3, Date.now());
        console.log('[DB] Migration 3 completed successfully');
      } catch (error) {
        console.error('[DB] Migration 3 failed:', error);
        throw error;
      }
    }
  }

  /**
   * Get database instance (for custom queries)
   */
  getDb(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[DB] Database connection closed');
    }
  }

  // ==================== SESSION OPERATIONS ====================

  /**
   * Create a new session
   */
  createSession(session: Omit<Session, 'created_at' | 'last_active' | 'is_active'>): Session {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const fullSession: Session = {
      ...session,
      created_at: now,
      last_active: now,
      is_active: 1,
    };

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, session_type, provider, name, partition, capture_id, url, created_at, last_active, is_active, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fullSession.id,
      fullSession.session_type,
      fullSession.provider || null,
      fullSession.name,
      fullSession.partition || null,
      fullSession.capture_id || null,
      fullSession.url || null,
      fullSession.created_at,
      fullSession.last_active,
      fullSession.is_active,
      fullSession.metadata || null
    );

    return fullSession;
  }

  /**
   * Get all active sessions
   */
  getSessions(includeArchived = false): Session[] {
    if (!this.db) throw new Error('Database not initialized');

    const query = includeArchived
      ? 'SELECT * FROM sessions ORDER BY last_active DESC'
      : 'SELECT * FROM sessions WHERE is_active = 1 ORDER BY last_active DESC';

    return this.db.prepare(query).all() as Session[];
  }

  /**
   * Get session by ID
   */
  getSession(id: string): Session | undefined {
    if (!this.db) throw new Error('Database not initialized');

    return this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(id) as Session | undefined;
  }

  /**
   * Update session last_active timestamp
   */
  updateSessionActivity(id: string): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE sessions SET last_active = ? WHERE id = ?')
      .run(Date.now(), id);
  }

  /**
   * Archive/unarchive session
   */
  setSessionActive(id: string, isActive: boolean): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE sessions SET is_active = ? WHERE id = ?')
      .run(isActive ? 1 : 0, id);
  }

  /**
   * Update session metadata
   */
  updateSessionMetadata(id: string, metadata: Record<string, any>): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE sessions SET metadata = ? WHERE id = ?')
      .run(JSON.stringify(metadata), id);
  }

  /**
   * Delete session (and all associated captures via CASCADE)
   */
  deleteSession(id: string): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  }

  // ==================== CAPTURE OPERATIONS ====================

  /**
   * Create a new capture
   */
  createCapture(capture: Omit<Capture, 'timestamp' | 'is_archived'>): Capture {
    if (!this.db) throw new Error('Database not initialized');

    const fullCapture: Capture = {
      ...capture,
      timestamp: Date.now(),
      is_archived: 0,
    };

    const stmt = this.db.prepare(`
      INSERT INTO captures (
        id, session_id, provider, prompt, response, response_format,
        model, timestamp, token_count, tags, notes, is_archived,
        message_type, topic, metadata_json, conversation_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fullCapture.id,
      fullCapture.session_id,
      fullCapture.provider,
      fullCapture.prompt,
      fullCapture.response,
      fullCapture.response_format || 'text',
      fullCapture.model || null,
      fullCapture.timestamp,
      fullCapture.token_count || null,
      fullCapture.tags || null,
      fullCapture.notes || null,
      fullCapture.is_archived,
      fullCapture.message_type || 'chat',
      fullCapture.topic || null,
      fullCapture.metadata_json || null,
      fullCapture.conversation_id || null
    );

    return fullCapture;
  }

  /**
   * Get capture by ID
   */
  getCapture(id: string): Capture | undefined {
    if (!this.db) throw new Error('Database not initialized');

    return this.db
      .prepare('SELECT * FROM captures WHERE id = ?')
      .get(id) as Capture | undefined;
  }

  /**
   * Get all captures with optional filters
   */
  getCaptures(filters: SearchFilters = {}): Capture[] {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM captures WHERE 1=1';
    const params: any[] = [];

    if (filters.provider) {
      query += ' AND provider = ?';
      params.push(filters.provider);
    }

    if (filters.startDate) {
      query += ' AND timestamp >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND timestamp <= ?';
      params.push(filters.endDate);
    }

    if (filters.isArchived !== undefined) {
      query += ' AND is_archived = ?';
      params.push(filters.isArchived ? 1 : 0);
    }

    if (filters.messageType) {
      query += ' AND message_type = ?';
      params.push(filters.messageType);
    }

    if (filters.topic) {
      query += ' AND topic = ?';
      params.push(filters.topic);
    }

    query += ' ORDER BY timestamp DESC';

    return this.db.prepare(query).all(...params) as Capture[];
  }

  /**
   * Full-text search across captures
   */
  searchCaptures(searchQuery: string, filters: SearchFilters = {}): Capture[] {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT c.* FROM captures c
      JOIN captures_fts fts ON c.rowid = fts.rowid
      WHERE captures_fts MATCH ?
    `;
    const params: any[] = [searchQuery];

    if (filters.provider) {
      query += ' AND c.provider = ?';
      params.push(filters.provider);
    }

    if (filters.isArchived !== undefined) {
      query += ' AND c.is_archived = ?';
      params.push(filters.isArchived ? 1 : 0);
    }

    if (filters.messageType) {
      query += ' AND c.message_type = ?';
      params.push(filters.messageType);
    }

    if (filters.topic) {
      query += ' AND c.topic = ?';
      params.push(filters.topic);
    }

    query += ' ORDER BY rank';

    return this.db.prepare(query).all(...params) as Capture[];
  }

  /**
   * Update capture tags
   */
  updateCaptureTags(id: string, tags: string[]): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE captures SET tags = ? WHERE id = ?')
      .run(JSON.stringify(tags), id);
  }

  /**
   * Update capture notes
   */
  updateCaptureNotes(id: string, notes: string): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE captures SET notes = ? WHERE id = ?')
      .run(notes, id);
  }

  /**
   * Archive/unarchive capture
   */
  setCaptureArchived(id: string, isArchived: boolean): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE captures SET is_archived = ? WHERE id = ?')
      .run(isArchived ? 1 : 0, id);
  }

  /**
   * Delete capture permanently
   */
  deleteCapture(id: string): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare('DELETE FROM captures WHERE id = ?').run(id);
  }

  /**
   * Update capture message type
   */
  updateCaptureMessageType(id: string, messageType: 'chat' | 'deep_research' | 'image' | 'code'): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE captures SET message_type = ? WHERE id = ?')
      .run(messageType, id);
  }

  /**
   * Update capture topic
   */
  updateCaptureTopic(id: string, topic: string | null): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare('UPDATE captures SET topic = ? WHERE id = ?')
      .run(topic, id);
  }

  /**
   * Update capture metadata JSON
   */
  updateCaptureMetadata(id: string, metadata: Record<string, any> | null): void {
    if (!this.db) throw new Error('Database not initialized');

    const metadataString = metadata ? JSON.stringify(metadata) : null;
    this.db
      .prepare('UPDATE captures SET metadata_json = ? WHERE id = ?')
      .run(metadataString, id);
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Get all unique tags from non-archived captures
   */
  getAllTags(): string[] {
    if (!this.db) throw new Error('Database not initialized');

    // Query all non-archived captures with tags
    const captures = this.db
      .prepare('SELECT tags FROM captures WHERE is_archived = 0 AND tags IS NOT NULL')
      .all() as Array<{ tags: string }>;

    // Extract and deduplicate tags
    const tagSet = new Set<string>();

    for (const capture of captures) {
      try {
        // Parse JSON tags array
        const tags = JSON.parse(capture.tags);
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            if (typeof tag === 'string' && tag.trim()) {
              tagSet.add(tag.trim());
            }
          });
        }
      } catch (error) {
        // Skip invalid JSON
        console.warn('[DB] Failed to parse tags JSON:', capture.tags, error);
      }
    }

    // Convert to sorted array
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    totalCaptures: number;
    archivedCaptures: number;
    dbSizeBytes: number;
  } {
    if (!this.db) throw new Error('Database not initialized');

    const totalSessions = this.db
      .prepare('SELECT COUNT(*) as count FROM sessions')
      .get() as { count: number };

    const activeSessions = this.db
      .prepare('SELECT COUNT(*) as count FROM sessions WHERE is_active = 1')
      .get() as { count: number };

    const totalCaptures = this.db
      .prepare('SELECT COUNT(*) as count FROM captures')
      .get() as { count: number };

    const archivedCaptures = this.db
      .prepare('SELECT COUNT(*) as count FROM captures WHERE is_archived = 1')
      .get() as { count: number };

    const stats = fs.statSync(this.dbPath);

    return {
      totalSessions: totalSessions.count,
      activeSessions: activeSessions.count,
      totalCaptures: totalCaptures.count,
      archivedCaptures: archivedCaptures.count,
      dbSizeBytes: stats.size,
    };
  }
}

// Singleton instance
export const db = new DatabaseService();
