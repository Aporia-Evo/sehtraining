import type { TrialPlan } from '../../src/core/types';

/** Gültiger linker Beispielplan; Felder per Override änderbar. */
export function samplePlan(overrides: Partial<TrialPlan> = {}): TrialPlan {
  return {
    id: 's-0',
    sessionId: 's',
    index: 0,
    kind: 'left',
    pos: { side: 'L', eccDeg: 8, angleDeg: 0 },
    gridPointId: 'L-e8-a0',
    level: 6,
    sound: 'sync',
    soaMs: 0,
    soundGainDb: 0,
    waitMs: 1500,
    rampMs: 150,
    plateauMs: 300,
    responseWindowMs: 2000,
    phase: '1',
    ...overrides,
  };
}

import type { TrialRecord } from '../../src/core/types';

/** Beispiel-Datensatz eines Durchgangs. */
export function sampleRecord(overrides: Partial<TrialRecord> = {}): TrialRecord {
  return {
    ...samplePlan(),
    startedAtIso: '2026-10-11T10:00:00.000Z',
    outcome: 'hit',
    rtMs: 420,
    contrast: 0.89,
    sigmaDeg: 0.5,
    stimulusPx: { x: 300, y: 400 },
    soundPlayed: true,
    fixationOk: null,
    abortReason: null,
    ...overrides,
  };
}
