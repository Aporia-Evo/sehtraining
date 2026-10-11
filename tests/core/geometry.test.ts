import { describe, it, expect } from 'vitest';
import {
  makeGeometry,
  visualToPx,
  pxToVisual,
  sigmaDegToPx,
  fitsOnScreen,
  maxEccentricityDeg,
  angularDistanceDeg,
} from '../../src/core/geometry';
import type { VisualPos } from '../../src/core/types';

// Referenz: 24 cm breit, Viewport 1200×800 → 50 px/cm; Abstand 30 cm; Kreuz bei 2/3, 1/2 → (800, 400)
const g = makeGeometry(
  { screenWidthCm: 24, viewingDistanceCm: 30, fixationXFraction: 2 / 3, fixationYFraction: 0.5 },
  1200,
  800,
);
const e = (Math.atan(10 / 30) * 180) / Math.PI; // 18.4349°: 10 cm vom Kreuz

describe('Geometrie', () => {
  it('pxPerCm und Kreuz', () => {
    expect(g.pxPerCm).toBeCloseTo(50);
    expect(g.fixPx.x).toBeCloseTo(800);
    expect(g.fixPx.y).toBeCloseTo(400);
  });

  it('links horizontal 10 cm', () => {
    const p = visualToPx(g, { side: 'L', eccDeg: e, angleDeg: 0 });
    expect(p.x).toBeCloseTo(300);
    expect(p.y).toBeCloseTo(400);
  });

  it('links oben senkrecht', () => {
    const p = visualToPx(g, { side: 'L', eccDeg: e, angleDeg: 90 });
    expect(p.x).toBeCloseTo(800);
    expect(p.y).toBeCloseTo(-100);
  });

  it('rechts unten 45°', () => {
    const p = visualToPx(g, { side: 'R', eccDeg: e, angleDeg: -45 });
    expect(p.x).toBeCloseTo(800 + 500 * Math.SQRT1_2);
    expect(p.y).toBeCloseTo(400 + 500 * Math.SQRT1_2);
  });

  it('Hin- und Rückrechnung', () => {
    const cases: VisualPos[] = [
      { side: 'L', eccDeg: 3, angleDeg: 75 },
      { side: 'L', eccDeg: 23, angleDeg: -30 },
      { side: 'R', eccDeg: 8, angleDeg: 0 },
    ];
    for (const pos of cases) {
      const px = visualToPx(g, pos);
      const v = pxToVisual(g, px.x, px.y);
      expect(v.side).toBe(pos.side);
      expect(v.eccDeg).toBeCloseTo(pos.eccDeg, 6);
      expect(v.angleDeg).toBeCloseTo(pos.angleDeg, 6);
    }
  });

  it('fitsOnScreen', () => {
    expect(fitsOnScreen(g, { side: 'L', eccDeg: e, angleDeg: 0 }, 1)).toBe(true);
    expect(fitsOnScreen(g, { side: 'L', eccDeg: 45, angleDeg: 0 }, 1)).toBe(false);
    expect(fitsOnScreen(g, { side: 'L', eccDeg: e, angleDeg: 90 }, 1)).toBe(false);
  });

  it('maxEccentricity links horizontal = atan(16/30)', () => {
    expect(maxEccentricityDeg(g, 'L', 0)).toBeCloseTo((Math.atan(16 / 30) * 180) / Math.PI, 3);
  });

  it('sigma wächst mit Exzentrizität', () => {
    expect(sigmaDegToPx(g, 20, 1)).toBeGreaterThan(sigmaDegToPx(g, 0, 1));
    expect(sigmaDegToPx(g, 0, 1)).toBeCloseTo(30 * Math.tan(Math.PI / 180) * 50, 6);
  });

  it('Winkelabstand über die Mittellinie', () => {
    expect(
      angularDistanceDeg({ side: 'L', eccDeg: 3, angleDeg: 0 }, { side: 'R', eccDeg: 3, angleDeg: 0 }),
    ).toBeCloseTo(6, 6);
  });

  it('Winkelabstand zu sich selbst ist 0', () => {
    const p: VisualPos = { side: 'L', eccDeg: 13, angleDeg: -45 };
    expect(angularDistanceDeg(p, p)).toBeCloseTo(0, 6);
  });
});
