import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BrainEntry {
  id: string;
  category: string;
  title: string;
  content: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface BrainEntryInput {
  category?: string;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}
