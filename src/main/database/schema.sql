-- DeepResearch SQLite Schema
-- Last Updated: 2025-10-20
-- Version: 1.0

-- AI Provider Sessions (tabs)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                  -- UUID
  provider TEXT NOT NULL,               -- 'claude' | 'openai' | 'gemini' | 'perplexity'
  name TEXT NOT NULL,                   -- User-friendly name
  partition TEXT NOT NULL UNIQUE,       -- Electron session partition ID
  created_at INTEGER NOT NULL,          -- Unix timestamp
  last_active INTEGER NOT NULL,         -- Unix timestamp
  is_active INTEGER DEFAULT 1,          -- 0 = archived (SQLite uses INTEGER for boolean)
  metadata TEXT                         -- JSON: {cookies, user_agent, custom_settings}
);

-- Captured AI Responses
CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY,                  -- UUID
  session_id TEXT NOT NULL,             -- FK to sessions.id
  provider TEXT NOT NULL,               -- Denormalized for faster queries

  -- Request data
  prompt TEXT NOT NULL,                 -- User's input

  -- Response data
  response TEXT NOT NULL,               -- AI's full response
  response_format TEXT DEFAULT 'text',  -- 'text' | 'markdown' | 'code' | 'json'

  -- Metadata
  model TEXT,                           -- e.g., 'claude-3-5-sonnet', 'gpt-4'
  timestamp INTEGER NOT NULL,           -- Unix timestamp
  token_count INTEGER,                  -- Estimated tokens (if available)

  -- Organization
  tags TEXT,                            -- JSON array: ["research", "coding"]
  notes TEXT,                           -- User's personal notes
  is_archived INTEGER DEFAULT 0,        -- Soft delete

  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS captures_fts USING fts5(
  prompt,
  response,
  tags,
  notes,
  content='captures',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with captures table
CREATE TRIGGER IF NOT EXISTS captures_ai AFTER INSERT ON captures BEGIN
  INSERT INTO captures_fts(rowid, prompt, response, tags, notes)
  VALUES (new.rowid, new.prompt, new.response, new.tags, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS captures_ad AFTER DELETE ON captures BEGIN
  DELETE FROM captures_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS captures_au AFTER UPDATE ON captures BEGIN
  UPDATE captures_fts SET
    prompt = new.prompt,
    response = new.response,
    tags = new.tags,
    notes = new.notes
  WHERE rowid = new.rowid;
END;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_captures_session ON captures(session_id);
CREATE INDEX IF NOT EXISTS idx_captures_provider ON captures(provider);
CREATE INDEX IF NOT EXISTS idx_captures_timestamp ON captures(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_captures_archived ON captures(is_archived);
CREATE INDEX IF NOT EXISTS idx_sessions_provider ON sessions(provider);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
