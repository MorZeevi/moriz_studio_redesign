import { isLeadSourceFilter, type LeadSourceFilter } from './diagnosticSource.ts';
import type { SortDir, SortKey } from './leadSort.ts';

export type LeadQueueView = 'real' | 'test';

export interface AdminQueueNavigation {
  secret: string;
  view: LeadQueueView;
  source: LeadSourceFilter;
  sort?: SortKey;
  dir: SortDir;
}

export function resolveLeadQueueView(value: unknown): LeadQueueView {
  return value === 'test' ? 'test' : 'real';
}

// Each app's admin page passes its own default (e.g. 'eyal' here, 'moriz' in
// Moriz_studio) — this module stays app-agnostic on purpose.
export function resolveLeadQueueSource(value: unknown, defaultSource: LeadSourceFilter): LeadSourceFilter {
  return isLeadSourceFilter(value) ? value : defaultSource;
}

function queueParams(navigation: AdminQueueNavigation): URLSearchParams {
  const params = new URLSearchParams({
    secret: navigation.secret,
    view: navigation.view,
    source: navigation.source,
  });
  if (navigation.sort) params.set('sort', navigation.sort);
  params.set('dir', navigation.dir);
  return params;
}

export function buildAdminQueueHref(navigation: AdminQueueNavigation): string {
  return `/admin?${queueParams(navigation).toString()}`;
}

export function buildAdminSortHref(
  navigation: AdminQueueNavigation,
  key: SortKey,
): string {
  const nextDir: SortDir =
    navigation.sort === key && navigation.dir === 'desc' ? 'asc' : 'desc';
  return buildAdminQueueHref({ ...navigation, sort: key, dir: nextDir });
}

export function buildAdminDetailHref(
  sessionId: string,
  navigation: AdminQueueNavigation,
): string {
  return `/admin/leads/${sessionId}?${queueParams(navigation).toString()}`;
}
