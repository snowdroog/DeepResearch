/**
 * Data seeding utilities for E2E tests
 *
 * Since the app doesn't have a public IPC handler for creating captures
 * (captures are created automatically by the browser extension),
 * we need to seed data directly through the database.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface TestCapture {
  id?: string;
  session_id: string;
  provider: string;
  prompt: string;
  response: string;
  model?: string;
  tags?: string[];
  notes?: string | null;
  token_count?: number;
  response_format?: string;
}

export interface TestSession {
  id?: string;
  provider: string;
  name: string;
  partition?: string;
}

/**
 * Seed test sessions directly into the database
 */
export function seedTestSessions(dbPath: string, sessions: TestSession[]) {
  const db = new Database(dbPath);

  try {
    for (const session of sessions) {
      const sessionId = session.id || randomUUID();
      const partition = session.partition || `persist:${session.provider}`;
      const now = Date.now();

      db.prepare(`
        INSERT INTO sessions (id, provider, name, partition, created_at, last_active, is_active, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        session.provider,
        session.name,
        partition,
        now,
        now,
        1, // is_active
        null // metadata
      );
    }
  } finally {
    db.close();
  }
}

/**
 * Seed test captures directly into the database
 */
export function seedTestCaptures(dbPath: string, captures: TestCapture[]) {
  const db = new Database(dbPath);

  try {
    for (const capture of captures) {
      const captureId = capture.id || randomUUID();
      const tags = capture.tags ? JSON.stringify(capture.tags) : null;
      const responseFormat = capture.response_format || 'text';
      const timestamp = Date.now();

      // Insert into captures table
      db.prepare(`
        INSERT INTO captures (
          id, session_id, provider, prompt, response,
          response_format, model, timestamp, token_count,
          tags, notes, is_archived
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        captureId,
        capture.session_id,
        capture.provider,
        capture.prompt,
        capture.response,
        responseFormat,
        capture.model || null,
        timestamp,
        capture.token_count || null,
        tags,
        capture.notes || null,
        0 // is_archived
      );
    }
  } finally {
    db.close();
  }
}

/**
 * Clear all test data from the database
 */
export function clearTestData(dbPath: string) {
  const db = new Database(dbPath);

  try {
    // Delete captures first (foreign key constraint)
    db.prepare('DELETE FROM captures').run();
    // Then delete sessions
    db.prepare('DELETE FROM sessions').run();
  } finally {
    db.close();
  }
}

/**
 * Get standard test data set for search/filter tests
 */
export function getSearchFilterTestData() {
  const sessionId = 'test-session-1';

  const sessions: TestSession[] = [
    {
      id: sessionId,
      provider: 'test',
      name: 'Test Session',
    }
  ];

  const captures: TestCapture[] = [
    {
      id: 'capture-1',
      session_id: sessionId,
      provider: 'claude',
      prompt: 'What is React hooks?',
      response: 'React hooks are functions that let you use state and other React features in functional components.',
      model: 'claude-3-opus',
      tags: ['react', 'hooks', 'frontend'],
      notes: 'Good explanation',
      token_count: 150,
    },
    {
      id: 'capture-2',
      session_id: sessionId,
      provider: 'openai',
      prompt: 'Explain TypeScript',
      response: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
      model: 'gpt-4',
      tags: ['typescript', 'javascript'],
      notes: 'Comprehensive overview',
      token_count: 120,
    },
    {
      id: 'capture-3',
      session_id: sessionId,
      provider: 'gemini',
      prompt: 'What is database indexing?',
      response: 'Database indexing improves query performance by creating data structures for faster retrieval.',
      model: 'gemini-pro',
      tags: ['database', 'performance'],
      notes: 'Technical details',
      token_count: 130,
    },
    {
      id: 'capture-4',
      session_id: sessionId,
      provider: 'claude',
      prompt: 'Best practices for React',
      response: 'React best practices include using hooks, component composition, and proper state management.',
      model: 'claude-3-sonnet',
      tags: ['react', 'best-practices', 'frontend'],
      notes: null,
      token_count: 140,
    },
    {
      id: 'capture-5',
      session_id: sessionId,
      provider: 'openai',
      prompt: 'What is API design?',
      response: 'API design involves creating interfaces for software components to communicate effectively.',
      model: 'gpt-4-turbo',
      tags: ['api', 'design'],
      notes: null,
      token_count: 110,
    },
  ];

  return { sessions, captures };
}
