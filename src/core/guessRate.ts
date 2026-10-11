/** Rate-Wahrscheinlichkeit γ aus Durchgängen ohne Reiz (falscher Alarm = Erfolg), Beta-Prior. */

export interface GuessRateState {
  falseAlarms: number;
  catchTrials: number;
}

/** Beta(1, 19): Prior-Mittel 0,05. */
export const GUESS_PRIOR = { a: 1, b: 19 } as const;

/** Posterior-Mittel (a + Alarme) / (a + b + Durchgänge). */
export function guessRate(s: GuessRateState): number {
  return (GUESS_PRIOR.a + s.falseAlarms) / (GUESS_PRIOR.a + GUESS_PRIOR.b + s.catchTrials);
}

/** Verbucht einen Durchgang ohne Reiz; gibt einen neuen Zustand zurück. */
export function updateGuessRate(s: GuessRateState, falseAlarm: boolean): GuessRateState {
  return { falseAlarms: s.falseAlarms + (falseAlarm ? 1 : 0), catchTrials: s.catchTrials + 1 };
}
