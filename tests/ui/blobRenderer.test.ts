import { describe, it, expect } from 'vitest';
import { createBlobRenderer } from '../../src/ui/StimulusCanvas';
import { renderBlobPatch } from '../../src/core/stimulus';

describe('createBlobRenderer (schneller Weg)', () => {
  it.each([
    [10, 4.0, 1],
    [10, 4.0, 0.37],
    [25, 0.4, 0.8],
    [3.3, 0.05, 1],
  ])('σ=%s, Kontrast=%s, gain=%s weicht höchstens 1 Stufe von der Referenz ab', (sigma, contrast, gain) => {
    const ref = renderBlobPatch(sigma, contrast, gain);
    const r = createBlobRenderer(sigma, contrast);
    const fast = r.render(gain);
    expect(r.size).toBe(ref.size);
    let maxDiff = 0;
    for (let i = 0; i < ref.rgba.length; i++) maxDiff = Math.max(maxDiff, Math.abs(ref.rgba[i]! - fast[i]!));
    expect(maxDiff).toBeLessThanOrEqual(1);
  });

  it('Rand bleibt exakt Hintergrund', () => {
    const r = createBlobRenderer(10, 4.0);
    const px = r.render(1);
    expect(px[0]).toBe(0x3c);
    expect(px[3]).toBe(255);
  });
});
