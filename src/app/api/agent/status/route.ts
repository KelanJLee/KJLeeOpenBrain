import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEFAULT_DOMAIN_PERMISSIONS } from '@/lib/agent-types';

export async function GET(request: NextRequest) {
  try {
    const { data: entries } = await supabase.from('brain_entries').select('*').order('updated_at', { ascending: false });

    const allEntries = (entries || []) as any[];

    const categoryCounts: Record<string, number> = {};
    for (const e of allEntries) {
      const cat = e.category || 'uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    const withTimestamps = allEntries.filter((e: any) => e.created_at);
    withTimestamps.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const recentEntries = withTimestamps.slice(0, 5).map((e: any) => ({
      id: e.id, title: e.title, category: e.category, created_at: e.created_at,
    }));

    const scored = allEntries.filter((e: any) => e.quality_score != null);
    const avgQuality = scored.length
      ? Math.round(scored.reduce((s: number, e: any) => s + e.quality_score, 0) / scored.length * 10) / 10
      : 0;

    const tagCounts: Record<string, number> = {};
    for (const e of allEntries) {
      if (e.tags) {
        for (const tag of e.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    const now = Date.now();
    const staleCount = allEntries.filter((e: any) => {
      const updated = e.updated_at || e.created_at;
      return updated && (now - new Date(updated).getTime()) / 86400000 > 60;
    }).length;

    const deadlines = [
      { date: '2026-06-10', label: 'PTSD claim supplemental filing deadline' },
    ];
    const activeDeadlines = deadlines
      .map(d => ({ ...d, daysRemaining: Math.ceil((new Date(d.date).getTime() - now) / 86400000) }))
      .filter(d => d.daysRemaining > 0 && d.daysRemaining <= 90);

    return NextResponse.json({
      status: 'online',
      version: '2.1.0',
      agent: {
        domains: Object.keys(categoryCounts),
        domainPermissions: DEFAULT_DOMAIN_PERMISSIONS.map(d => ({
          domain: d.domain,
          maxLevel: d.maxLevel,
          label: ['read', 'suggest', 'draft', 'act+confirm', 'autonomous'][d.maxLevel - 1],
          enabled: d.enabled,
        })),
      },
      stats: {
        totalEntries: allEntries.length,
        categories: categoryCounts,
        averageQuality: avgQuality,
        staleEntries: staleCount,
        topTags,
      },
      memory: {
        available: true,
        totalInteractions: 0,
        queryDomains: {},
        recentQueries: [],
      },
      deadlines: activeDeadlines,
      recentEntries,
      integrations: {
        lmStudio: false,
        obsidianVault: true,
        cron: { dailyReview: true },
      },
      endpoints: {
        query: 'GET /api/query?q=... or POST /api/query',
        suggest: 'POST /api/agent/suggest',
        act: 'POST /api/agent/act',
        salience: 'GET /api/agent/salience',
        cron: 'GET /api/cron/daily',
      },
    });
  } catch (err) {
    return NextResponse.json({ status: 'error', error: (err as Error).message }, { status: 500 });
  }
}
