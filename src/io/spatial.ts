/** Reine Hilfsfunktionen: Ort im Gesichtsfeld → Hörrichtung. */
import type { VisualPos } from '../core/types';

const RAD = Math.PI / 180;

/** Richtungsvektor (s·tan e·cos φ, tan e·sin φ, 1); Azimut links negativ. */
export function visualToAzEl(p: VisualPos): { azimuthDeg: number; elevationDeg: number } {
  const s = p.side === 'L' ? -1 : 1;
  const t = Math.tan(p.eccDeg * RAD);
  const x = s * t * Math.cos(p.angleDeg * RAD);
  const y = t * Math.sin(p.angleDeg * RAD);
  return {
    azimuthDeg: Math.atan2(x, 1) / RAD,
    elevationDeg: Math.atan2(y, Math.sqrt(1 + x * x)) / RAD,
  };
}

export function stereoPan(azimuthDeg: number): number {
  return Math.max(-1, Math.min(1, Math.sin(azimuthDeg * RAD)));
}

export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

/** Spiegelt einen Ort an der vertikalen Mittellinie auf die rechte Seite (für Falsch-Ton-Durchgänge). */
export function mirrorToRight(p: VisualPos): VisualPos {
  return { ...p, side: 'R' };
}
