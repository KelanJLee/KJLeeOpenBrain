import { NextRequest, NextResponse } from 'next/server';

interface SalienceRule {
  id: string;
  domain: string;
  trigger: 'stale' | 'deadline' | 'trend' | 'new-entry' | 'time-based' | 'query-pattern';
  conditions: Record<string, unknown>;
  weight: number;
  enabled: boolean;
}

let salienceRules: SalienceRule[] = [
  { id: 'stale-30', domain: 'VA', trigger: 'stale', conditions: { daysSinceUpdate: 30 }, weight: 2.0, enabled: true },
  { id: 'stale-60', domain: 'knowledge', trigger: 'stale', conditions: { daysSinceUpdate: 60 }, weight: 1.5, enabled: true },
  { id: 'deadline-ptsd', domain: 'VA', trigger: 'deadline', conditions: { keyword: 'PTSD', daysUntil: 30 }, weight: 3.0, enabled: true },
  { id: 'trend-query', domain: 'general', trigger: 'query-pattern', conditions: { minQueries: 3, windowDays: 7 }, weight: 1.0, enabled: true },
];

export async function GET() {
  return NextResponse.json({ rules: salienceRules });
}
