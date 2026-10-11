import { describe, it, expect } from 'vitest';
import { checkTrialPlan, checkGap, stimulusInterval, SAFETY } from '../../src/core/safety';
import { samplePlan } from '../helpers/plans';

describe('checkTrialPlan', () => {
  it('gültiger Plan → keine Meldung', () => {
    expect(checkTrialPlan(samplePlan())).toEqual([]);
  });

  it('gültiger Plan ohne Reiz → keine Meldung', () => {
    expect(checkTrialPlan(samplePlan({ kind: 'catch', pos: null, gridPointId: null, level: null, sound: 'none' }))).toEqual([]);
  });

  it('Rampe 99 ms', () => {
    expect(checkTrialPlan(samplePlan({ rampMs: 99 }))).toHaveLength(1);
  });

  it('Stufe 12', () => {
    expect(checkTrialPlan(samplePlan({ level: 12 }))).toHaveLength(1);
  });

  it('Stufe fehlt bei Reiz', () => {
    expect(checkTrialPlan(samplePlan({ level: null }))).toHaveLength(1);
  });

  it('Tonpegel +1 dB', () => {
    expect(checkTrialPlan(samplePlan({ soundGainDb: 1 }))).toHaveLength(1);
  });

  it('Durchgang ohne Reiz mit Ort', () => {
    expect(checkTrialPlan(samplePlan({ kind: 'catch', level: null, sound: 'none' }))).toHaveLength(1);
  });

  it('Durchgang ohne Reiz mit Stufe', () => {
    expect(checkTrialPlan(samplePlan({ kind: 'catch', pos: null, level: 6, sound: 'none' }))).toHaveLength(1);
  });

  it('negative Wartezeit', () => {
    expect(checkTrialPlan(samplePlan({ waitMs: -1 }))).toHaveLength(1);
  });

  it('Meldungen sind deutsch', () => {
    expect(checkTrialPlan(samplePlan({ rampMs: 50 }))[0]).toMatch(/Rampe/);
  });
});

describe('checkGap', () => {
  it('weniger als 1000 ms → Meldung', () => {
    expect(checkGap(1000, 1999)).toHaveLength(1);
  });
  it('genau 1000 ms → ok', () => {
    expect(checkGap(1000, 2000)).toEqual([]);
  });
  it('kein vorheriger Reiz → ok', () => {
    expect(checkGap(null, 0)).toEqual([]);
  });
  it('Mindestabstand ist 1000 ms', () => {
    expect(SAFETY.minGapMs).toBe(1000);
  });
});

describe('stimulusInterval', () => {
  it('Ton vorher', () => {
    expect(stimulusInterval(samplePlan({ sound: 'lead', soaMs: -200 }))).toEqual({ startMs: -200, endMs: 600 });
  });
  it('Licht allein', () => {
    expect(stimulusInterval(samplePlan({ sound: 'none' }))).toEqual({ startMs: 0, endMs: 600 });
  });
  it('ohne Reiz und ohne Ton → null', () => {
    expect(stimulusInterval(samplePlan({ kind: 'catch', pos: null, level: null, sound: 'none' }))).toBeNull();
  });
});
