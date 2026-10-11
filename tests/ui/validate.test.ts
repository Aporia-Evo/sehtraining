import { describe, it, expect } from 'vitest';
import { parseCm } from '../../src/ui/validate';

const MSG = 'Bitte einen Wert zwischen 10 und 200 cm eingeben.';

describe('parseCm', () => {
  it.each([
    ['24,5', 24.5],
    ['24.5', 24.5],
    [' 30 ', 30],
    ['10', 10],
    ['200', 200],
  ])('%s → %s', (input, value) => {
    expect(parseCm(input)).toEqual({ ok: true, value });
  });

  it.each(['5', '0', 'abc', '', '250', '9,99', '24,5,1', '1e2', '-30'])('%s → abgelehnt', (input) => {
    expect(parseCm(input)).toEqual({ ok: false, message: MSG });
  });
});

import { geometryProblems } from '../../src/ui/validate';
import { makeGeometry } from '../../src/core/geometry';

describe('geometryProblems', () => {
  it('normale iPad-Geometrie ohne Problem', () => {
    const g = makeGeometry({ screenWidthCm: 24, viewingDistanceCm: 30, fixationXFraction: 2 / 3, fixationYFraction: 0.5 }, 1200, 800);
    expect(geometryProblems(g)).toEqual([]);
  });
  it('kein Rasterpunkt rechts (zu großer Abstand, Kreuz ganz rechts) → Meldung', () => {
    const g = makeGeometry({ screenWidthCm: 24, viewingDistanceCm: 200, fixationXFraction: 0.8, fixationYFraction: 0.5 }, 1200, 800);
    expect(geometryProblems(g)).toHaveLength(1);
    expect(geometryProblems(g)[0]).toMatch(/rechts/i);
  });
});

import { viewportMatches } from '../../src/ui/validate';

describe('viewportMatches', () => {
  const setup = { width: 1180, height: 820 };
  it('gleiche Größe (auch nach Drehen um 180°) passt', () => {
    expect(viewportMatches(setup, 1180, 820)).toBe(true);
    expect(viewportMatches(setup, 1185, 815)).toBe(true); // ±2 % Toleranz
  });
  it('Split View oder Hochformat passt nicht', () => {
    expect(viewportMatches(setup, 780, 820)).toBe(false);
    expect(viewportMatches(setup, 820, 1180)).toBe(false);
  });
  it('ohne gespeicherte Größe (alte Einrichtung) passt alles im Querformat', () => {
    expect(viewportMatches(null, 1000, 700)).toBe(true);
    expect(viewportMatches(null, 700, 1000)).toBe(false);
  });
});
