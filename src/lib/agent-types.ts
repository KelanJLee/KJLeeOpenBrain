export enum PermissionLevel {
  READ = 1,
  SUGGEST = 2,
  DRAFT = 3,
  ACT_CONFIRM = 4,
  AUTONOMOUS = 5,
}

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  [PermissionLevel.READ]: 'read',
  [PermissionLevel.SUGGEST]: 'suggest',
  [PermissionLevel.DRAFT]: 'draft',
  [PermissionLevel.ACT_CONFIRM]: 'act with confirmation',
  [PermissionLevel.AUTONOMOUS]: 'autonomous',
};

export interface DomainPermission {
  domain: string;
  maxLevel: PermissionLevel;
  enabled: boolean;
  requiresConfirmation: boolean;
}

export interface AgentAction {
  id: string;
  type: 'search' | 'summarize' | 'flag-stale' | 'suggest-tags' | 'create-entry' | 'update-entry';
  label: string;
  description: string;
  requiredLevel: PermissionLevel;
  params: Record<string, unknown>;
}

export interface AgentSuggestion {
  id: string;
  type: 'review' | 'deadline' | 'explore' | 'consolidate' | 'summarize' | 'trend';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: AgentAction;
  source: string;
  ttlSeconds?: number;
}

export const DEFAULT_DOMAIN_PERMISSIONS: DomainPermission[] = [
  { domain: 'VA', maxLevel: PermissionLevel.SUGGEST, enabled: true, requiresConfirmation: true },
  { domain: 'knowledge', maxLevel: PermissionLevel.SUGGEST, enabled: true, requiresConfirmation: true },
  { domain: 'resource', maxLevel: PermissionLevel.SUGGEST, enabled: true, requiresConfirmation: true },
  { domain: 'Tax', maxLevel: PermissionLevel.SUGGEST, enabled: true, requiresConfirmation: true },
  { domain: 'AI', maxLevel: PermissionLevel.SUGGEST, enabled: true, requiresConfirmation: true },
  { domain: 'general', maxLevel: PermissionLevel.DRAFT, enabled: true, requiresConfirmation: false },
];

export const DEFAULT_DEADLINES: Array<{ date: string; label: string; category: string; keywords: string[] }> = [
  { date: '2026-06-10', label: 'PTSD claim supplemental filing deadline', category: 'VA', keywords: ['ptsd', 'claim', 'supplemental'] },
];
