import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://kjlee-open-brain.vercel.app';

interface BrainEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  quality_score?: number;
  created_at: string;
}

interface ScoredResult {
  entry: BrainEntry;
  score: number;
  matchField: string;
  matches: string[];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s,;:.!?()"]+/).filter(t => t.length > 2);
}

function scoreEntry(entry: BrainEntry, terms: string[]): ScoredResult | null {
  const searchable = [
    { field: 'title', text: entry.title || '' },
    { field: 'tags', text: (entry.tags || []).join(' ') },
    { field: 'content', text: entry.content || '' },
  ];

  let totalScore = 0;
  const matches: string[] = [];

  for (const term of terms) {
    for (const { field, text } of searchable) {
      const lower = text.toLowerCase();
      if (lower.includes(term)) {
        const boost = field === 'title' ? 3 : field === 'tags' ? 1.5 : 1;
        const count = (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        totalScore += boost * Math.min(count, 5);
        if (!matches.includes(term)) matches.push(term);
      }
    }
  }

  if (totalScore === 0) return null;

  const maxPossible = terms.length * 5 * 3;
  const score = Math.min(totalScore / maxPossible, 1);

  const matchField =
    terms.some(t => (entry.title || '').toLowerCase().includes(t)) ? 'title' :
    terms.some(t => (entry.tags || []).join(' ').toLowerCase().includes(t)) ? 'tags' :
    'content';

  return { entry, score, matchField, matches };
}

async function fetchEntries(): Promise<BrainEntry[]> {
  const { data } = await supabase.from('brain_entries').select('*').order('updated_at', { ascending: false });
  return (data || []) as BrainEntry[];
}

async function handleQuery(question: string, topK: number, category: string | undefined) {
  if (!question || typeof question !== 'string') {
    throw new Error('`question` (string) is required');
  }

  let entries = await fetchEntries();

  if (category) {
    entries = entries.filter(e => e.category === category);
  }

  const terms = tokenize(question);
  const scored: ScoredResult[] = [];

  for (const entry of entries) {
    const result = scoreEntry(entry, terms);
    if (result) scored.push(result);
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  const results = top.map(r => ({
    id: r.entry.id,
    title: r.entry.title,
    category: r.entry.category,
    score: Math.round(r.score * 100) / 100,
    matchField: r.matchField,
    quality_score: r.entry.quality_score || 0,
    created_at: r.entry.created_at,
  }));

  const topKeywords = [...new Set(top.flatMap(r => r.matches))].slice(0, 10);

  return {
    question,
    totalMatches: scored.length,
    results,
    keywords: topKeywords,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('q');
    const topK = Number(searchParams.get('topK')) || 5;
    const category = searchParams.get('category') || undefined;
    const result = await handleQuery(question || '', topK, category);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, topK = 10, category } = body;
    const result = await handleQuery(question, topK, category);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
