import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng';

describe('createRng', () => {
  it('ist deterministisch je Seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
  });

  it('liefert für verschiedene Seeds verschiedene Folgen', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('liefert Werte in [0,1)', () => {
    const r = createRng(1);
    for (let i = 0; i < 10000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(n) deckt 0..n-1 ab', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(r.int(5));
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('shuffle ist Permutation und verändert Eingabe nicht', () => {
    const xs = [1, 2, 3, 4, 5];
    const s = createRng(3).shuffle(xs);
    expect([...s].sort()).toEqual(xs);
    expect(xs).toEqual([1, 2, 3, 4, 5]);
  });

  it('Mittelwert von uniform(1000,2500) nahe 1750', () => {
    const r = createRng(9);
    let s = 0;
    for (let i = 0; i < 20000; i++) s += r.uniform(1000, 2500);
    expect(s / 20000).toBeGreaterThan(1730);
    expect(s / 20000).toBeLessThan(1770);
  });

  it('seed() gibt den Startwert zurück', () => {
    expect(createRng(123).seed()).toBe(123);
  });
});
