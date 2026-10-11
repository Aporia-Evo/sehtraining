// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createAbortSignals, soundStartSec } from '../../src/ui/browserDeps';

describe('createAbortSignals', () => {
  it('meldet hidden bei visibilitychange', () => {
    const s = createAbortSignals(window, document);
    const cb = vi.fn();
    const off = s.onAbort(cb);
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).toHaveBeenCalledWith('hidden');
    off();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('meldet resize nur bei geänderter Größe', () => {
    const s = createAbortSignals(window, document);
    const cb = vi.fn();
    const off = s.onAbort(cb);
    window.dispatchEvent(new Event('resize'));
    expect(cb).not.toHaveBeenCalled();
    Object.defineProperty(window, 'innerWidth', { value: window.innerWidth + 100, configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(cb).toHaveBeenCalledWith('resize');
    off();
  });

  it('nach Abmelden keine Meldung', () => {
    const s = createAbortSignals(window, document);
    const cb = vi.fn();
    s.onAbort(cb)();
    Object.defineProperty(window, 'innerWidth', { value: window.innerWidth + 50, configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('soundStartSec', () => {
  it('rechnet performance-Zeit in AudioContext-Zeit um', () => {
    // Ton soll bei t0 + soa = 1500 - 200 = 1300 ms beginnen; jetzt 1000 ms; Audio-Uhr 5 s → 5,3 s
    expect(soundStartSec({ t0Ms: 1500, soaMs: -200, nowMs: 1000, audioNowSec: 5 })).toBeCloseTo(5.3);
  });
  it('nie in der Vergangenheit', () => {
    expect(soundStartSec({ t0Ms: 1000, soaMs: 0, nowMs: 1200, audioNowSec: 5 })).toBe(5);
  });
});
