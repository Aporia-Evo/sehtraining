import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { openDb, DEFAULT_SETTINGS, type SessionRecord } from '../../src/store/db';
import { sampleRecord } from '../helpers/plans';

let n = 0;
const freshDb = () => openDb(`test-db-${n++}`);

const session = (id: string): SessionRecord => ({
  id,
  startedAtIso: '2026-10-11T10:00:00.000Z',
  endedAtIso: null,
  dayKey: '2026-10-11',
  kind: 'training',
  trialCount: 0,
});

describe('Db', () => {
  it('leere DB liefert Standard-Einstellungen', async () => {
    const db = await freshDb();
    expect(await db.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('Standard-Einstellungen: Kopfhörer, halbe Lautstärke, kein Hinweis bestätigt', () => {
    expect(DEFAULT_SETTINGS.audio).toEqual({ outputMode: 'headphones', volume: 0.5, balance: 0 });
    expect(DEFAULT_SETTINGS.disclaimerAcceptedAt).toBeNull();
    expect(DEFAULT_SETTINGS.geometry).toBeNull();
  });

  it('Einstellungen speichern und lesen', async () => {
    const db = await freshDb();
    const s = {
      ...DEFAULT_SETTINGS,
      disclaimerAcceptedAt: '2026-10-11T09:00:00.000Z',
      geometry: { screenWidthCm: 24, viewingDistanceCm: 30, fixationXFraction: 2 / 3, fixationYFraction: 0.5 },
    };
    await db.saveSettings(s);
    expect(await db.getSettings()).toEqual(s);
  });

  it('Sitzungen und Durchgänge, Filter nach Sitzung', async () => {
    const db = await freshDb();
    await db.addSession(session('s1'));
    await db.addSession(session('s2'));
    await db.addTrial(sampleRecord({ id: 's1-0', sessionId: 's1', index: 0 }));
    await db.addTrial(sampleRecord({ id: 's1-1', sessionId: 's1', index: 1 }));
    await db.addTrial(sampleRecord({ id: 's2-0', sessionId: 's2', index: 0 }));
    expect(await db.listSessions()).toHaveLength(2);
    expect((await db.listTrials('s1')).map((t) => t.id).sort()).toEqual(['s1-0', 's1-1']);
    expect(await db.listTrials()).toHaveLength(3);
  });

  it('updateSession überschreibt', async () => {
    const db = await freshDb();
    await db.addSession(session('s1'));
    await db.updateSession({ ...session('s1'), trialCount: 20, endedAtIso: '2026-10-11T10:05:00.000Z' });
    const [s] = await db.listSessions();
    expect(s!.trialCount).toBe(20);
  });

  it('clearAll leert alles', async () => {
    const db = await freshDb();
    await db.addSession(session('s1'));
    await db.addTrial(sampleRecord());
    await db.saveSettings({ ...DEFAULT_SETTINGS, disclaimerAcceptedAt: 'x' });
    await db.clearAll();
    expect(await db.listSessions()).toEqual([]);
    expect(await db.listTrials()).toEqual([]);
    expect(await db.getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
