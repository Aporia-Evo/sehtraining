import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { openDb, DEFAULT_SETTINGS } from '../../src/store/db';
import { exportAll, importAll, trialsToCsv, EXPORT_SCHEMA, CSV_COLUMNS } from '../../src/store/exportData';
import { sampleRecord } from '../helpers/plans';

let n = 0;
const freshDb = () => openDb(`export-db-${n++}`);

const HEADER =
  'id;sessionId;index;startedAtIso;kind;side;eccDeg;angleDeg;gridPointId;level;contrast;sigmaDeg;sound;soaMs;soundGainDb;waitMs;responseWindowMs;phase;outcome;rtMs;soundPlayed;fixationOk;abortReason';

describe('Export und Import', () => {
  it('Runde ohne Verlust', async () => {
    const a = await freshDb();
    await a.saveSettings({ ...DEFAULT_SETTINGS, disclaimerAcceptedAt: '2026-10-11T09:00:00.000Z' });
    await a.addSession({ id: 's1', startedAtIso: 'a', endedAtIso: 'b', dayKey: '2026-10-11', kind: 'training', trialCount: 2 });
    await a.addTrial(sampleRecord({ id: 's1-0', sessionId: 's1' }));
    await a.addTrial(sampleRecord({ id: 's1-1', sessionId: 's1', index: 1, outcome: 'miss', rtMs: null }));
    const bundle = await exportAll(a, '2026-10-11T12:00:00.000Z');
    expect(bundle.schema).toBe(EXPORT_SCHEMA);

    const b = await freshDb();
    await b.addTrial(sampleRecord({ id: 'alt', sessionId: 'alt' }));
    const res = await importAll(b, JSON.parse(JSON.stringify(bundle)));
    expect(res).toEqual({ sessions: 1, trials: 2 });
    expect(await b.listSessions()).toEqual(await a.listSessions());
    const sortById = <T extends { id: string }>(xs: T[]) => [...xs].sort((x, y) => x.id.localeCompare(y.id));
    expect(sortById(await b.listTrials())).toEqual(sortById(await a.listTrials()));
    expect(await b.getSettings()).toEqual(await a.getSettings());
  });

  it('falsches Format wird abgelehnt', async () => {
    const db = await freshDb();
    await expect(importAll(db, { schema: 'x' })).rejects.toThrow(/Format/);
    await expect(importAll(db, null)).rejects.toThrow(/Format/);
  });
});

describe('trialsToCsv', () => {
  it('Kopfzeile, BOM, Semikolon', () => {
    const csv = trialsToCsv([sampleRecord()]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n')[0]).toBe(HEADER);
    expect(CSV_COLUMNS.join(';')).toBe(HEADER);
  });

  it('Werte in Spaltenreihenfolge, null leer, Dezimalpunkt', () => {
    const csv = trialsToCsv([sampleRecord({ rtMs: null, outcome: 'miss', contrast: 0.89 })]);
    const row = csv.slice(1).split('\r\n')[1]!.split(';');
    const col = (name: string) => row[CSV_COLUMNS.indexOf(name as (typeof CSV_COLUMNS)[number])];
    expect(col('side')).toBe('L');
    expect(col('eccDeg')).toBe('8');
    expect(col('rtMs')).toBe('');
    expect(col('fixationOk')).toBe('');
    expect(col('contrast')).toBe('0.89');
    expect(col('outcome')).toBe('miss');
  });

  it('Sonderzeichen werden gequotet', () => {
    const csv = trialsToCsv([sampleRecord({ abortReason: 'a;b"c' })]);
    expect(csv).toContain('"a;b""c"');
  });

  it('Durchgang ohne Reiz: Ortsspalten leer', () => {
    const csv = trialsToCsv([sampleRecord({ kind: 'catch', pos: null, gridPointId: null, level: null })]);
    const row = csv.slice(1).split('\r\n')[1]!.split(';');
    expect(row[CSV_COLUMNS.indexOf('side')]).toBe('');
    expect(row[CSV_COLUMNS.indexOf('eccDeg')]).toBe('');
  });
});
