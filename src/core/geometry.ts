/**
 * Umrechnung zwischen Sehwinkel (Grad) und Bildschirmpixeln.
 * Flacher Bildschirm, Zentralprojektion: Ein Ort mit Exzentrizität e liegt d·tan(e) vom Kreuz entfernt.
 */
import type { Side, VisualPos } from './types';

export interface GeometryInput {
  screenWidthCm: number;
  viewingDistanceCm: number;
  /** Position des Fixationskreuzes als Anteil der Breite (Standard 2/3, nach rechts versetzt). */
  fixationXFraction: number;
  fixationYFraction: number;
}

export interface Geometry extends GeometryInput {
  viewportWidthPx: number;
  viewportHeightPx: number;
  pxPerCm: number;
  fixPx: { x: number; y: number };
}

const RAD = Math.PI / 180;

export function makeGeometry(input: GeometryInput, viewportWidthPx: number, viewportHeightPx: number): Geometry {
  return {
    ...input,
    viewportWidthPx,
    viewportHeightPx,
    pxPerCm: viewportWidthPx / input.screenWidthCm,
    fixPx: { x: viewportWidthPx * input.fixationXFraction, y: viewportHeightPx * input.fixationYFraction },
  };
}

/** Einheitsrichtung auf dem Bildschirm (Pixelachsen, y nach unten). */
function screenDirection(side: Side, angleDeg: number): { dx: number; dy: number } {
  const s = side === 'L' ? -1 : 1;
  return { dx: s * Math.cos(angleDeg * RAD), dy: -Math.sin(angleDeg * RAD) };
}

export function visualToPx(g: Geometry, p: VisualPos): { x: number; y: number } {
  const rPx = g.viewingDistanceCm * Math.tan(p.eccDeg * RAD) * g.pxPerCm;
  const { dx, dy } = screenDirection(p.side, p.angleDeg);
  return { x: g.fixPx.x + rPx * dx, y: g.fixPx.y + rPx * dy };
}

export function pxToVisual(g: Geometry, x: number, y: number): VisualPos {
  const dxCm = (x - g.fixPx.x) / g.pxPerCm;
  const dyCm = -(y - g.fixPx.y) / g.pxPerCm;
  const side: Side = dxCm < 0 ? 'L' : 'R';
  const eccDeg = Math.atan(Math.hypot(dxCm, dyCm) / g.viewingDistanceCm) / RAD;
  const angleDeg = Math.atan2(dyCm, Math.abs(dxCm)) / RAD;
  return { side, eccDeg, angleDeg };
}

/** σ in Pixeln am Reizort, radialer Maßstab d·(tan(e+σ) − tan(e)). */
export function sigmaDegToPx(g: Geometry, eccDeg: number, sigmaDeg: number): number {
  return g.viewingDistanceCm * (Math.tan((eccDeg + sigmaDeg) * RAD) - Math.tan(eccDeg * RAD)) * g.pxPerCm;
}

/** Größte Exzentrizität, die in dieser Richtung noch auf dem Bildschirm liegt. */
export function maxEccentricityDeg(g: Geometry, side: Side, angleDeg: number): number {
  const { dx, dy } = screenDirection(side, angleDeg);
  const eps = 1e-12;
  const tx = dx > eps ? (g.viewportWidthPx - g.fixPx.x) / dx : dx < -eps ? g.fixPx.x / -dx : Infinity;
  const ty = dy > eps ? (g.viewportHeightPx - g.fixPx.y) / dy : dy < -eps ? g.fixPx.y / -dy : Infinity;
  const rCm = Math.min(tx, ty) / g.pxPerCm;
  return Math.atan(rCm / g.viewingDistanceCm) / RAD;
}

export function fitsOnScreen(g: Geometry, p: VisualPos, marginDeg: number): boolean {
  return p.eccDeg + marginDeg <= maxEccentricityDeg(g, p.side, p.angleDeg);
}

function unitVector(p: VisualPos): [number, number, number] {
  const s = p.side === 'L' ? -1 : 1;
  const t = Math.tan(p.eccDeg * RAD);
  const x = s * t * Math.cos(p.angleDeg * RAD);
  const y = t * Math.sin(p.angleDeg * RAD);
  const n = Math.hypot(x, y, 1);
  return [x / n, y / n, 1 / n];
}

/** Winkel zwischen zwei Blickrichtungen in Grad. */
export function angularDistanceDeg(a: VisualPos, b: VisualPos): number {
  const [ax, ay, az] = unitVector(a);
  const [bx, by, bz] = unitVector(b);
  const dot = ax * bx + ay * by + az * bz;
  const cx = ay * bz - az * by;
  const cy = az * bx - ax * bz;
  const cz = ax * by - ay * bx;
  return Math.atan2(Math.hypot(cx, cy, cz), dot) / RAD;
}
