import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEFAULT_DEADLINES } from '@/lib/agent-types';

export async function GET() {
  try {
    const { data: entries } = await supabase.from('brain_entries').select('*');
    const allEntries = (entries || []) as any[];
    const now = Date.now();
    const report: Record<string, any> = {
      timestamp: new Date().toISOString(),
      totalEntries: allEntries.length,
      sections: [],
    };

    const stale = allEntries.filter((e: any) => {
      const updated = e.updated_at || e.created_at;
      return updated && (now - new Date(updated).getTime()) / 86400000 > 60;
    });
    report.sections.push({
      type: 'stale-entries',
      count: stale.length,
      detail: stale.length > 0
        ? `Oldest: "${stale[stale.length - 1]?.title}" (${Math.floor((now - new Date(stale[stale.length - 1]?.updated_at || stale[stale.length - 1]?.created_at).getTime()) / 86400000)} days)`
        : 'No stale entries',
    });

    const catCounts: Record<string, number> = {};
    for (const e of allEntries) {
      const cat = e.category || 'unknown';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    report.sections.push({
      type: 'category-distribution',
      categories: Object.entries(catCounts).map(([name, count]) => ({ name, count })),
    });

    const scored = allEntries.filter((e: any) => e.quality_score != null);
    const avg = scored.length
      ? (scored.reduce((s: number, e: any) => s + e.quality_score, 0) / scored.length).toFixed(2)
      : 'N/A';
    report.sections.push({ type: 'quality', averageQuality: avg, scoredEntries: scored.length });

    const recent = allEntries.filter((e: any) => {
      const created = e.created_at;
      return created && (now - new Date(created).getTime()) / 86400000 <= 7;
    });
    report.sections.push({ type: 'growth', newLast7Days: recent.length });

    for (const dl of DEFAULT_DEADLINES) {
      const remaining = Math.ceil((new Date(dl.date).getTime() - now) / 86400000);
      if (remaining > 0 && remaining <= 30) {
        report.sections.push({
          type: 'deadline',
          label: dl.label,
          daysRemaining: remaining,
          urgency: remaining <= 7 ? 'critical' : 'warning',
        });
      }
    }

    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
