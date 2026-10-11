import { describe, it, expect } from 'vitest';
import { resolveRoute, blockSummary } from '../../src/ui/routing';
import { DEFAULT_SETTINGS, DEFAULT_GEOMETRY } from '../../src/store/db';
import { sampleRecord } from '../helpers/plans';

const ready = { ...DEFAULT_SETTINGS, disclaimerAcceptedAt: 'x', geometry: DEFAULT_GEOMETRY };

describe('resolveRoute', () => {
  it('ohne bestätigten Hinweis immer Einrichtung', () => {
    for (const h of ['#/', '#/train', '#/export', '#/test', '']) {
      expect(resolveRoute(h, { ...ready, disclaimerAcceptedAt: null })).toBe('setup');
    }
  });
  it('ohne Geometrie Einrichtung, außer Export (Datenrettung)', () => {
    expect(resolveRoute('#/train', { ...ready, geometry: null })).toBe('setup');
    expect(resolveRoute('#/export', { ...ready, disclaimerAcceptedAt: 'x', geometry: null })).toBe('export');
  });
  it('bekannte Routen', () => {
    expect(resolveRoute('#/', ready)).toBe('start');
    expect(resolveRoute('', ready)).toBe('start');
    expect(resolveRoute('#/train', ready)).toBe('train');
    expect(resolveRoute('#/setup', ready)).toBe('setup');
    expect(resolveRoute('#/export', ready)).toBe('export');
    expect(resolveRoute('#/test', ready)).toBe('test');
    expect(resolveRoute('#/unbekannt', ready)).toBe('start');
  });
});

describe('blockSummary', () => {
  it('zählt nur linke Durchgänge mit Reiz', () => {
    const recs = [
      sampleRecord({ kind: 'left', outcome: 'hit' }),
      sampleRecord({ kind: 'left', outcome: 'miss' }),
      sampleRecord({ kind: 'left', outcome: 'anticipation' }),
      sampleRecord({ kind: 'right', outcome: 'hit' }),
      sampleRecord({ kind: 'catch', outcome: 'correctRejection' }),
      sampleRecord({ kind: 'left', outcome: 'aborted' }),
    ];
    expect(blockSummary(recs)).toEqual({ found: 1, total: 3 });
  });
});
