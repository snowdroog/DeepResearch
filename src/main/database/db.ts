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
  provider: string;
  name: string;
  partition: string;
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
}

export interface SearchFilters {
  provider?: string;
  startDate?: number;
  endDate?: number;
  isArchived?: boolean;
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

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema (handles CREATE TABLE IF NOT EXISTS)
    this.db.exec(schema);
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
      INSERT INTO sessions (id, provider, name, partition, created_at, last_active, is_active, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fullSession.id,
      fullSession.provider,
      fullSession.name,
      fullSession.partition,
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
        model, timestamp, token_count, tags, notes, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      fullCapture.is_archived
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

  // ==================== UTILITY OPERATIONS ====================

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
