import { NextRequest, NextResponse } from 'next/server';
import { DomainPermission, PermissionLevel, DEFAULT_DOMAIN_PERMISSIONS } from '@/lib/agent-types';

let domainPermissions: DomainPermission[] = [...DEFAULT_DOMAIN_PERMISSIONS];

export async function GET() {
  return NextResponse.json({ domains: domainPermissions });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, maxLevel, enabled, requiresConfirmation } = body;

    const idx = domainPermissions.findIndex(d => d.domain === domain);
    if (idx === -1) {
      return NextResponse.json({ error: `Domain '${domain}' not found` }, { status: 404 });
    }

    if (maxLevel !== undefined) {
      if (![1, 2, 3, 4, 5].includes(maxLevel)) {
        return NextResponse.json({ error: 'maxLevel must be 1-5' }, { status: 400 });
      }
      domainPermissions[idx].maxLevel = maxLevel as PermissionLevel;
    }
    if (enabled !== undefined) domainPermissions[idx].enabled = enabled;
    if (requiresConfirmation !== undefined) domainPermissions[idx].requiresConfirmation = requiresConfirmation;

    return NextResponse.json({ domain: domainPermissions[idx] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
