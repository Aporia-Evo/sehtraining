import { describe, it, expect } from 'vitest';
import { runTrial } from '../../src/ui/runner';
import { samplePlan } from '../helpers/plans';
import { fakeDeps } from '../helpers/fakeRunner';

const ISO = '2026-10-11T10:00:00.000Z';
const T0 = 1500; // waitMs des Beispielplans, Start bei 0

describe('runTrial', () => {
  it('Antwort 400 ms nach t0 → Treffer, Ton einmal geplant', async () => {
    const f = fakeDeps();
    const plan = samplePlan();
    const p = runTrial(plan, f.deps, ISO);
    f.respondAt(T0 + 400);
    f.advanceTo(T0 + 700);
    const r = await p;
    expect(r.outcome).toBe('hit');
    expect(r.rtMs).toBe(400);
    expect(f.deps.scheduleSound).toHaveBeenCalledTimes(1);
    expect(f.deps.scheduleSound).toHaveBeenCalledWith(plan, T0);
    expect(r.startedAtIso).toBe(ISO);
    expect(r.contrast).toBeCloseTo(0.05 * 80 ** (6 / 8));
    expect(r.sigmaDeg).toBe(0.5);
    expect(r.stimulusPx!.x).toBeLessThan(800);
  });

  it('Treffer endet erst nach dem Ausblenden', async () => {
    const f = fakeDeps();
    let done = false;
    const p = runTrial(samplePlan(), f.deps, ISO).then((r) => {
      done = true;
      return r;
    });
    f.respondAt(T0 + 300);
    f.advanceTo(T0 + 550);
    await Promise.resolve();
    expect(done).toBe(false);
    f.advanceTo(T0 + 620);
    await p;
    expect(done).toBe(true);
  });

  it('keine Antwort → verpasst nach Ablauf des Fensters', async () => {
    const f = fakeDeps();
    const p = runTrial(samplePlan(), f.deps, ISO);
    f.advanceTo(T0 + 2100);
    const r = await p;
    expect(r.outcome).toBe('miss');
    expect(r.rtMs).toBeNull();
  });

  it('Antwort 100 ms vor t0 → vorweggenommen', async () => {
    const f = fakeDeps();
    const p = runTrial(samplePlan(), f.deps, ISO);
    f.respondAt(T0 - 100);
    f.advanceTo(T0 + 700);
    const r = await p;
    expect(r.outcome).toBe('anticipation');
    expect(r.rtMs).toBe(-100);
  });

  it('ohne Reiz und ohne Antwort → korrekt zurückgewiesen, nie ein Lichtfleck', async () => {
    const f = fakeDeps();
    const p = runTrial(samplePlan({ kind: 'catch', pos: null, gridPointId: null, level: null, sound: 'none' }), f.deps, ISO);
    f.advanceTo(T0 + 2100);
    const r = await p;
    expect(r.outcome).toBe('correctRejection');
    expect(f.draws.every((d) => d.state.blob === null)).toBe(true);
    expect(f.deps.scheduleSound).not.toHaveBeenCalled();
    expect(r.contrast).toBeNull();
    expect(r.stimulusPx).toBeNull();
  });

  it.each(['hidden', 'resize'] as const)('Abbruch %s → aborted, Fleck sofort weg', async (reason) => {
    const f = fakeDeps();
    const p = runTrial(samplePlan(), f.deps, ISO);
    f.advanceTo(T0 + 100);
    f.abort(reason);
    f.advanceTo(T0 + 120);
    const r = await p;
    expect(r.outcome).toBe('aborted');
    expect(r.abortReason).toBe(reason);
    expect(f.draws.at(-1)!.state.blob).toBeNull();
  });

  it('Hüllkurve im gezeichneten Fleck', async () => {
    const f = fakeDeps();
    const p = runTrial(samplePlan(), f.deps, ISO);
    f.advanceTo(T0 + 2100);
    await p;
    const at = (t: number) => f.draws.find((d) => d.t === t)!.state.blob!;
    expect(at(T0 + 75).gain).toBeCloseTo(0.5);
    expect(at(T0 + 300).gain).toBe(1);
    expect(f.draws.find((d) => d.t === T0 - 5)!.state.blob).toBeNull();
    expect(f.draws.every((d) => d.state.fixation)).toBe(true);
  });
});
