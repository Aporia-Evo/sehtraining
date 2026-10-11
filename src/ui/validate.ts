import { gridPoints } from '../core/blocks';
import type { Geometry } from '../core/geometry';

/** Eingabeprüfung für die Einrichtung. */

const CM_MESSAGE = 'Bitte einen Wert zwischen 10 und 200 cm eingeben.';

/** Zentimeterwert mit Komma oder Punkt als Dezimaltrenner, 10–200 cm. */
export function parseCm(input: string): { ok: true; value: number } | { ok: false; message: string } {
  const s = input.trim();
  if (!/^\d+([.,]\d+)?$/.test(s)) return { ok: false, message: CM_MESSAGE };
  const value = Number(s.replace(',', '.'));
  if (!(value >= 10 && value <= 200)) return { ok: false, message: CM_MESSAGE };
  return { ok: true, value };
}

/** Prüft, ob mit dieser Geometrie links und rechts Reizorte auf den Bildschirm passen. */
export function geometryProblems(g: Geometry): string[] {
  const problems: string[] = [];
  if (gridPoints(g, 'L').length === 0) problems.push('Links passt kein Reizort auf den Bildschirm. Abstand verringern oder Kreuz weiter nach rechts.');
  if (gridPoints(g, 'R').length === 0) problems.push('Rechts passt kein Reizort auf den Bildschirm. Abstand verringern oder Kreuz weiter nach links.');
  return problems;
}

/** Toleranz für die Fenstergröße gegenüber der Einrichtung. */
const VIEWPORT_TOLERANCE = 0.02;

/**
 * Training nur im Querformat und in der Fenstergröße der Einrichtung. In Split View oder Stage Manager
 * wäre die Umrechnung cm → Pixel falsch und alle Gradangaben verfälscht.
 */
export function viewportMatches(setup: { width: number; height: number } | null, width: number, height: number): boolean {
  if (width < height) return false;
  if (!setup) return true;
  return Math.abs(width - setup.width) <= setup.width * VIEWPORT_TOLERANCE && Math.abs(height - setup.height) <= setup.height * VIEWPORT_TOLERANCE;
}
