import { describe, it, expect } from 'vitest';
import { visualToAzEl, stereoPan, dbToGain, mirrorToRight } from '../../src/io/spatial';

describe('spatial', () => {
  it('links horizontal 30° → Azimut −30°, Elevation 0', () => {
    const r = visualToAzEl({ side: 'L', eccDeg: 30, angleDeg: 0 });
    expect(r.azimuthDeg).toBeCloseTo(-30);
    expect(r.elevationDeg).toBeCloseTo(0);
  });
  it('senkrecht oben 30° → Azimut 0, Elevation 30°', () => {
    const r = visualToAzEl({ side: 'L', eccDeg: 30, angleDeg: 90 });
    expect(r.azimuthDeg).toBeCloseTo(0);
    expect(r.elevationDeg).toBeCloseTo(30);
  });
  it('rechts ist positiv', () => {
    expect(visualToAzEl({ side: 'R', eccDeg: 10, angleDeg: 0 }).azimuthDeg).toBeCloseTo(10);
  });
  it('stereoPan', () => {
    expect(stereoPan(-90)).toBeCloseTo(-1);
    expect(stereoPan(0)).toBeCloseTo(0);
    expect(stereoPan(30)).toBeCloseTo(0.5);
  });
  it('dbToGain', () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
  });
  it('mirrorToRight spiegelt nur die Seite', () => {
    expect(mirrorToRight({ side: 'L', eccDeg: 8, angleDeg: -30 })).toEqual({ side: 'R', eccDeg: 8, angleDeg: -30 });
  });
});
