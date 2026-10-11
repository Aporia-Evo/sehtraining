import { describe, expect, it } from 'vitest';
import { GUESS_PRIOR, guessRate, updateGuessRate, type GuessRateState } from '../../src/core/guessRate';

describe('guessRate', () => {
  it('leer: Prior-Mittel 0,05', () => {
    expect(GUESS_PRIOR).toEqual({ a: 1, b: 19 });
    expect(guessRate({ falseAlarms: 0, catchTrials: 0 })).toBeCloseTo(0.05);
  });

  it('nach 10 Durchgängen ohne Alarm: 1/30', () => {
    let s: GuessRateState = { falseAlarms: 0, catchTrials: 0 };
    for (let i = 0; i < 10; i++) s = updateGuessRate(s, false);
    expect(guessRate(s)).toBeCloseTo(1 / 30);
  });

  it('nach 1 Alarm in 10 Durchgängen: 2/30', () => {
    let s: GuessRateState = { falseAlarms: 0, catchTrials: 0 };
    s = updateGuessRate(s, true);
    for (let i = 0; i < 9; i++) s = updateGuessRate(s, false);
    expect(s).toEqual({ falseAlarms: 1, catchTrials: 10 });
    expect(guessRate(s)).toBeCloseTo(2 / 30);
  });

  it('Update erzeugt ein neues Objekt und lässt das alte unverändert', () => {
    const s: GuessRateState = { falseAlarms: 0, catchTrials: 0 };
    const t = updateGuessRate(s, true);
    expect(t).not.toBe(s);
    expect(s).toEqual({ falseAlarms: 0, catchTrials: 0 });
    expect(t).toEqual({ falseAlarms: 1, catchTrials: 1 });
  });
});
