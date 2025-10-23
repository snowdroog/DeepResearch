-- Migration 002: Add Capture Session Support
-- Adds support for 'capture' type sessions that display captured responses as tabs
-- Author: System
-- Date: 2025-10-22

-- Step 1: Add new columns to sessions table
ALTER TABLE sessions ADD COLUMN session_type TEXT NOT NULL DEFAULT 'provider';
ALTER TABLE sessions ADD COLUMN capture_id TEXT;
ALTER TABLE sessions ADD COLUMN url TEXT;

-- Step 2: Update existing constraints
-- Note: SQLite doesn't support modifying column constraints directly
-- We need to check if provider should be nullable, but ALTER COLUMN isn't supported
-- Instead, we'll handle this at the application level

-- Step 3: Create foreign key relationship (handled by schema)
-- FOREIGN KEY (capture_id) REFERENCES captures(id) ON DELETE CASCADE
-- Note: This is enforced in the main schema.sql

-- Step 4: Create index on capture_id for performance
CREATE INDEX IF NOT EXISTS idx_sessions_capture_id ON sessions(capture_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions(session_type);

-- Step 5: Update existing sessions to have session_type = 'provider'
UPDATE sessions SET session_type = 'provider' WHERE session_type IS NULL OR session_type = '';

-- Step 6: Make partition nullable for capture sessions
-- Note: SQLite doesn't support ALTER COLUMN to change NULL constraints
-- The application will handle this by making partition optional in the Session interface
