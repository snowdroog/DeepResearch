-- Migration: Add enhanced metadata fields for beautiful chat display
-- Version: 1.1
-- Date: 2025-10-21
-- Description: Adds message_type, topic, and metadata_json fields to captures table

-- Add message_type column (default to 'chat' for existing records)
ALTER TABLE captures ADD COLUMN message_type TEXT DEFAULT 'chat' CHECK(message_type IN ('chat', 'deep_research', 'image', 'code'));

-- Add topic column for extracted/user-defined topics (nullable)
ALTER TABLE captures ADD COLUMN topic TEXT;

-- Add metadata_json column for extensible metadata storage (nullable)
ALTER TABLE captures ADD COLUMN metadata_json TEXT;

-- Create index on message_type for filtering performance
CREATE INDEX IF NOT EXISTS idx_captures_message_type ON captures(message_type);

-- Create index on topic for search performance
CREATE INDEX IF NOT EXISTS idx_captures_topic ON captures(topic);

-- Note: FTS table will be updated automatically via existing triggers
-- The triggers already handle updates to the captures table
