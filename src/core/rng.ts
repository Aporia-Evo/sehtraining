/** Seedbarer Zufallsgenerator (mulberry32). Einzige Zufallsquelle in core/. */
export interface Rng {
  /** Gleichverteilt in [0, 1). */
  next(): number;
  /** Gleichverteilt in [a, b). */
  uniform(a: number, b: number): number;
  /** Ganzzahl in 0..n-1. */
  int(n: number): number;
  /** Neue, gemischte Kopie (Fisher-Yates). */
  shuffle<T>(xs: readonly T[]): T[];
  seed(): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n: number): number => Math.floor(next() * n);
  return {
    next,
    uniform: (a, b) => a + (b - a) * next(),
    int,
    shuffle<T>(xs: readonly T[]): T[] {
      const out = [...xs];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    seed: () => seed,
  };
}
