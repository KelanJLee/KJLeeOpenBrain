import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AgentAction, PermissionLevel, DomainPermission, PERMISSION_LABELS, DEFAULT_DOMAIN_PERMISSIONS } from '@/lib/agent-types';

let domainPermissions: DomainPermission[] = [...DEFAULT_DOMAIN_PERMISSIONS];

function getPermission(domain: string): DomainPermission {
  return domainPermissions.find(d => d.domain === domain)
    || { domain, maxLevel: PermissionLevel.SUGGEST, enabled: true, requiresConfirmation: true };
}

function checkPermission(action: AgentAction, domain: string): { allowed: boolean; reason?: string; requiresConfirmation: boolean } {
  const perm = getPermission(domain);

  if (!perm.enabled) {
    return { allowed: false, reason: `Domain '${domain}' is disabled`, requiresConfirmation: false };
  }

  if (action.requiredLevel > perm.maxLevel) {
    return {
      allowed: false,
      reason: `Action '${action.label}' requires level ${action.requiredLevel} (${PERMISSION_LABELS[action.requiredLevel as PermissionLevel]}), but '${domain}' max is ${perm.maxLevel} (${PERMISSION_LABELS[perm.maxLevel as PermissionLevel]})`,
      requiresConfirmation: false,
    };
  }

  if (action.requiredLevel >= PermissionLevel.ACT_CONFIRM && perm.requiresConfirmation) {
    return { allowed: true, requiresConfirmation: true };
  }

  return { allowed: true, requiresConfirmation: false };
}

async function executeSearch(params: Record<string, unknown>): Promise<any> {
  const q = params.query as string;
  const topK = (params.topK as number) || 5;
  const { data } = await supabase.from('brain_entries').select('*');
  const entries: any[] = (data || []) as any[];

  const terms = q.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
  const scored = entries.map(e => {
    const text = ((e.title || '') + ' ' + (e.content || '')).toLowerCase();
    const matches = terms.filter((t: string) => text.includes(t));
    return { entry: e, score: matches.length / Math.max(terms.length, 1) };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);

  return { results: scored.map(s => ({ id: s.entry.id, title: s.entry.title, score: s.score })) };
}

async function executeSummarize(params: Record<string, unknown>): Promise<any> {
  const category = params.category as string;
  const { data } = await supabase.from('brain_entries').select('*');
  const entries: any[] = (data || []) as any[];
  const filtered = category ? entries.filter(e => e.category === category) : entries;

  return {
    category: category || 'all',
    entryCount: filtered.length,
    summary: `Found ${filtered.length} entries${category ? ` in '${category}'` : ''}. Average quality score: ${(filtered.reduce((s: number, e: any) => s + (e.quality_score || 0), 0) / Math.max(filtered.length, 1)).toFixed(1)}.`,
  };
}

async function executeFlagStale(params: Record<string, unknown>): Promise<any> {
  const days = (params.days as number) || 60;
  const { data } = await supabase.from('brain_entries').select('*');
  const entries: any[] = (data || []) as any[];

  const stale = entries.filter((e: any) => {
    const updated = e.updated_at || e.created_at;
    return updated && Math.floor((Date.now() - new Date(updated).getTime()) / 86400000) > days;
  });

  return {
    daysThreshold: days,
    staleCount: stale.length,
    staleEntries: stale.slice(0, 10).map((e: any) => ({
      id: e.id, title: e.title, category: e.category,
    })),
  };
}

async function executePreview(action: AgentAction, domain: string): Promise<any> {
  switch (action.type) {
    case 'search': return executeSearch(action.params);
    case 'summarize': return executeSummarize(action.params);
    case 'flag-stale': return executeFlagStale(action.params);
    default: return { note: 'Preview not available for this action type' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, domain, permissionLevel, confirm } = body;

    if (!action || !action.type) {
      return NextResponse.json({ error: '`action.type` is required' }, { status: 400 });
    }

    const actionDef: AgentAction = {
      id: `act-${Date.now()}`,
      type: action.type,
      label: action.label || action.type,
      description: action.description || '',
      requiredLevel: permissionLevel || PermissionLevel.SUGGEST,
      params: action.params || {},
    };

    const dom = domain || 'general';
    const check = checkPermission(actionDef, dom);

    if (!check.allowed) {
      return NextResponse.json({
        error: check.reason,
        action: actionDef,
        permissionCheck: check,
      }, { status: 403 });
    }

    if (check.requiresConfirmation && !confirm) {
      const preview = await executePreview(actionDef, dom);
      return NextResponse.json({
        requiresConfirmation: true,
        message: `Action '${actionDef.label}' requires confirmation for domain '${dom}'`,
        action: actionDef,
        domain: dom,
        preview,
      });
    }

    let result: any;
    switch (actionDef.type) {
      case 'search':
        result = await executeSearch(actionDef.params);
        break;
      case 'summarize':
        result = await executeSummarize(actionDef.params);
        break;
      case 'flag-stale':
        result = await executeFlagStale(actionDef.params);
        break;
      case 'suggest-tags':
        result = { message: 'Tag suggestions not yet implemented', params: actionDef.params };
        break;
      case 'create-entry':
      case 'update-entry':
        return NextResponse.json({ error: `Action '${actionDef.type}' not yet implemented on server` }, { status: 501 });
      default:
        return NextResponse.json({ error: `Unknown action type: '${actionDef.type}'` }, { status: 400 });
    }

    return NextResponse.json({
      executed: true,
      action: actionDef,
      domain: dom,
      permissionLevel: actionDef.requiredLevel,
      result,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
