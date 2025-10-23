-- Migration: Add conversation thread tracking
-- Version: 3
-- Description: Adds conversation_id to link related messages in a thread

-- Add conversation_id column to captures table
ALTER TABLE captures ADD COLUMN conversation_id TEXT;

-- Create index for efficient conversation queries
CREATE INDEX IF NOT EXISTS idx_captures_conversation ON captures(conversation_id);

-- Create index for conversation + timestamp queries (chronological order within threads)
CREATE INDEX IF NOT EXISTS idx_captures_conversation_timestamp ON captures(conversation_id, timestamp);
