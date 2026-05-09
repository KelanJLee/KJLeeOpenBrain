import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentSuggestion, DEFAULT_DEADLINES } from '@/lib/agent-types';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function staleEntrySuggestions(entries: any[]): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];
  const byCategory: Record<string, any[]> = {};

  for (const e of entries) {
    const cat = e.category || 'unknown';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(e);
  }

  for (const [category, catEntries] of Object.entries(byCategory)) {
    const stale = catEntries.filter((e: any) => {
      const updated = e.updated_at || e.created_at;
      return updated && daysSince(updated) > 60;
    });
    if (stale.length >= 3) {
      suggestions.push({
        id: `stale-${category}-${Date.now()}`,
        type: 'review',
        title: `${stale.length} entries in '${category}' haven't been updated in 60+ days`,
        description: `The oldest is "${stale[0].title}" (${daysSince(stale[0].updated_at || stale[0].created_at)} days). Consider reviewing for accuracy and relevance.`,
        priority: stale.length > 10 ? 'high' : stale.length > 5 ? 'medium' : 'low',
        source: 'decay-tracker',
      });
    }
  }

  return suggestions;
}

function deadlineSuggestions(): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];

  for (const dl of DEFAULT_DEADLINES) {
    const remaining = daysUntil(dl.date);
    if (remaining <= 0) continue;
    if (remaining <= 30) {
      suggestions.push({
        id: `deadline-${dl.keywords[0]}-${Date.now()}`,
        type: 'deadline',
        title: `Upcoming deadline: ${dl.label}`,
        description: `${remaining} days remaining. Query your '${dl.category}' entries to prepare.`,
        priority: remaining <= 7 ? 'high' : 'medium',
        source: 'deadline-tracker',
      });
    }
  }

  return suggestions;
}

function explorationSuggestions(entries: any[]): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];
  const byCategory: Record<string, number> = {};

  for (const e of entries) {
    const cat = e.category || 'unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  const smallest = Object.entries(byCategory).sort(([, a], [, b]) => a - b).slice(0, 2);
  for (const [cat, count] of smallest) {
    if (count < 5) {
      suggestions.push({
        id: `explore-${cat}-${Date.now()}`,
        type: 'explore',
        title: `'${cat}' category has only ${count} entries`,
        description: 'Small categories may be incomplete. Consider adding more knowledge here.',
        priority: 'low',
        source: 'category-analyzer',
      });
    }
  }

  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { context } = body;

    const { data: entries } = await supabase.from('brain_entries').select('*');
    const allEntries = (entries || []) as any[];

    const sources = [
      ...staleEntrySuggestions(allEntries),
      ...deadlineSuggestions(),
      ...explorationSuggestions(allEntries),
    ];

    const seen = new Set<string>();
    const unique = sources.filter(s => {
      const key = s.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    unique.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({
      count: unique.length,
      suggestions: unique,
      context: context || {},
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
