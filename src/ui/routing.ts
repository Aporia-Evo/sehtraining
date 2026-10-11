/** Routing per Hash und einfache Auswertungen für die Bildschirme. */
import type { TrialRecord } from '../core/types';
import type { Settings } from '../store/db';

export type Route = 'start' | 'setup' | 'train' | 'export' | 'test';

const ROUTES: Record<string, Route> = {
  '#/setup': 'setup',
  '#/train': 'train',
  '#/export': 'export',
  '#/test': 'test',
};

/** Ohne bestätigten Hinweis gibt es keine Nutzung; ohne Geometrie kein Training (Export bleibt zur Datenrettung erreichbar). */
export function resolveRoute(hash: string, s: Settings): Route {
  if (!s.disclaimerAcceptedAt) return 'setup';
  const r = ROUTES[hash] ?? 'start';
  if (!s.geometry && r !== 'export') return 'setup';
  return r;
}

/** „Heute X von Y gefunden“: linke Durchgänge mit Reiz, abgebrochene zählen nicht. */
export function blockSummary(recs: readonly TrialRecord[]): { found: number; total: number } {
  const left = recs.filter((r) => r.kind === 'left' && r.outcome !== 'aborted');
  return { found: left.filter((r) => r.outcome === 'hit').length, total: left.length };
}
