/**
 * Sicherheitsregeln (Spec 10): weiche Rampen, kein schnelles Wiederholen, begrenzte Größe, Helligkeit und Lautstärke.
 * Jeder Reizplan wird vor der Darbietung geprüft.
 */
import { CONTRAST_CAP, LEVEL_COUNT, SIGMA_MAX_DEG, levelParams } from './stimulus';
import type { TrialPlan } from './types';

export const SAFETY = {
  minRampMs: 100,
  stimulusDurationMs: 600,
  /** Mindestabstand zwischen Ende eines Reizes und Beginn des nächsten: höchstens 1 Hz, weit unter 3 Hz. */
  minGapMs: 1000,
  maxSoundGainDb: 0,
} as const;

/** Zeitraum, in dem Licht oder Ton laufen, relativ zu t0. null, wenn nichts dargeboten wird. */
export function stimulusInterval(plan: TrialPlan): { startMs: number; endMs: number } | null {
  const dur = 2 * plan.rampMs + plan.plateauMs;
  const parts: Array<[number, number]> = [];
  if (plan.kind !== 'catch') parts.push([0, dur]);
  if (plan.sound !== 'none') parts.push([plan.soaMs, plan.soaMs + dur]);
  if (parts.length === 0) return null;
  return {
    startMs: Math.min(...parts.map((p) => p[0])),
    endMs: Math.max(...parts.map((p) => p[1])),
  };
}

export function checkTrialPlan(plan: TrialPlan): string[] {
  const errors: string[] = [];
  if (plan.rampMs < SAFETY.minRampMs) errors.push(`Rampe zu kurz: ${plan.rampMs} ms (mindestens ${SAFETY.minRampMs} ms).`);
  if (plan.waitMs < 0) errors.push(`Wartezeit negativ: ${plan.waitMs} ms.`);
  if (plan.soundGainDb > SAFETY.maxSoundGainDb) errors.push(`Tonpegel über dem Deckel: ${plan.soundGainDb} dB.`);

  if (plan.kind === 'catch') {
    if (plan.pos !== null) errors.push('Durchgang ohne Reiz darf keinen Ort haben.');
    if (plan.level !== null) errors.push('Durchgang ohne Reiz darf keine Reizstufe haben.');
    return errors;
  }

  if (plan.pos === null) errors.push('Durchgang mit Reiz braucht einen Ort.');
  if (plan.level === null || !Number.isInteger(plan.level) || plan.level < 0 || plan.level >= LEVEL_COUNT) {
    errors.push(`Ungültige Reizstufe: ${plan.level}.`);
  } else {
    const { contrast, sigmaDeg } = levelParams(plan.level);
    if (contrast > CONTRAST_CAP + 1e-9) errors.push(`Kontrast über dem Deckel: ${contrast}.`);
    if (sigmaDeg > SIGMA_MAX_DEG + 1e-9) errors.push(`Reiz zu groß: σ = ${sigmaDeg}°.`);
  }
  return errors;
}

/** Prüft den Abstand zwischen zwei Reizen auf derselben Zeitachse (ms). */
export function checkGap(prevEndAbsMs: number | null, nextStartAbsMs: number): string[] {
  if (prevEndAbsMs === null) return [];
  const gap = nextStartAbsMs - prevEndAbsMs;
  return gap < SAFETY.minGapMs ? [`Reize zu dicht: ${Math.round(gap)} ms Abstand (mindestens ${SAFETY.minGapMs} ms).`] : [];
}
