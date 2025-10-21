import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

export interface TestCapture {
  id?: string;
  session_id?: string;
  provider?: string;
  prompt?: string;
  response?: string;
  response_format?: string;
  model?: string;
  timestamp?: number;
  token_count?: number;
  tags?: string[];
  notes?: string;
  is_archived?: number;
}

/**
 * Seed test database with captures
 */
export function seedCaptures(dbPath: string, captures: TestCapture[]): string[] {
  const db = new Database(dbPath);
  const captureIds: string[] = [];

  try {
    const stmt = db.prepare(`
      INSERT INTO captures (
        id, session_id, provider, prompt, response, response_format,
        model, timestamp, token_count, tags, notes, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const capture of captures) {
      const id = capture.id || randomUUID();
      const sessionId = capture.session_id || randomUUID();
      const timestamp = capture.timestamp || Date.now();

      stmt.run(
        id,
        sessionId,
        capture.provider || 'claude',
        capture.prompt || 'Test prompt',
        capture.response || 'Test response',
        capture.response_format || 'text',
        capture.model || 'test-model',
        timestamp,
        capture.token_count || 100,
        capture.tags ? JSON.stringify(capture.tags) : null,
        capture.notes || null,
        capture.is_archived || 0
      );

      captureIds.push(id);
    }
  } finally {
    db.close();
  }

  return captureIds;
}

/**
 * Clear all captures from test database
 */
export function clearCaptures(dbPath: string): void {
  const db = new Database(dbPath);
  try {
    db.prepare('DELETE FROM captures').run();
  } finally {
    db.close();
  }
}

/**
 * Get all captures from test database
 */
export function getCaptures(dbPath: string): any[] {
  const db = new Database(dbPath);
  try {
    return db.prepare('SELECT * FROM captures ORDER BY timestamp DESC').all();
  } finally {
    db.close();
  }
}
