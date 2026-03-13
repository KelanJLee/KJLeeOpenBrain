-- Open Brain Database Schema
-- Run this in Supabase SQL Editor to set up your database

-- Create brain_entries table (main data store)
CREATE TABLE brain_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'memory',
    title TEXT NOT NULL,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_category ON brain_entries(category);
CREATE INDEX idx_tags ON brain_entries USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE brain_entries ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for development (customize for production)
CREATE POLICY "Allow public access" ON brain_entries
    FOR ALL USING (true) WITH CHECK (true);

-- Create preferences table for AI instructions
CREATE TABLE preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default AI system prompt
INSERT INTO preferences (key, value) VALUES 
    ('ai_system_prompt', '{"prompt": "You are a helpful assistant with access to the users personal knowledge base. Always reference their stored information when answering questions about them."}'),
    ('user_profile', '{"name": "", "goals": [], "context": {}}');
