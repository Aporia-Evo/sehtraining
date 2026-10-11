import { describe, it, expect, vi } from 'vitest';
import { AudioEngine, MASTER_GAIN_CAP, initialVolume } from '../../src/io/audio';

function param(value = 0) {
  return { value, setValueAtTime: vi.fn(), setValueCurveAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}
function node(extra: Record<string, unknown> = {}) {
  return { connect: vi.fn((n: unknown) => n), disconnect: vi.fn(), ...extra };
}

/** Minimaler Fake eines AudioContext; merkt sich erzeugte Gain-Knoten. */
function fakeContext(state: string) {
  const gains: Array<{ gain: ReturnType<typeof param> }> = [];
  const ctx = {
    state,
    currentTime: 0,
    sampleRate: 48000,
    destination: node(),
    resume: vi.fn(async () => {
      ctx.state = 'running';
    }),
    createGain: vi.fn(() => {
      const g = node({ gain: param(1) }) as ReturnType<typeof node> & { gain: ReturnType<typeof param> };
      gains.push(g);
      return g;
    }),
    createDynamicsCompressor: vi.fn(() => node({ threshold: param(), ratio: param(), knee: param(), attack: param(), release: param() })),
    createBuffer: vi.fn((ch: number, len: number) => ({ getChannelData: () => new Float32Array(len), duration: len / 48000, numberOfChannels: ch })),
    createBufferSource: vi.fn(() => node({ buffer: null, start: vi.fn(), stop: vi.fn() })),
    createOscillator: vi.fn(() => node({ frequency: param(), type: 'sine', start: vi.fn(), stop: vi.fn() })),
    createPanner: vi.fn(() => node({ positionX: param(), positionY: param(), positionZ: param() })),
    createStereoPanner: vi.fn(() => node({ pan: param() })),
  };
  return { ctx, gains };
}

describe('AudioEngine', () => {
  it.each(['interrupted', 'suspended'])('ensureRunning ruft resume bei %s', async (state) => {
    const { ctx } = fakeContext(state);
    const eng = new AudioEngine(() => ctx as unknown as AudioContext);
    await eng.ensureRunning();
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('ensureRunning ruft resume nicht bei running', async () => {
    const { ctx } = fakeContext('running');
    const eng = new AudioEngine(() => ctx as unknown as AudioContext);
    await eng.ensureRunning();
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it('Kontext wird nur einmal erzeugt, auch nach Unterbrechung', async () => {
    const { ctx } = fakeContext('running');
    const factory = vi.fn(() => ctx as unknown as AudioContext);
    const eng = new AudioEngine(factory);
    await eng.ensureRunning();
    ctx.state = 'interrupted';
    await eng.ensureRunning();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('Lautstärke wird auf den Deckel geklemmt', async () => {
    const { ctx, gains } = fakeContext('running');
    const eng = new AudioEngine(() => ctx as unknown as AudioContext);
    await eng.ensureRunning();
    eng.apply({ outputMode: 'headphones', volume: 2, balance: 0 });
    expect(gains[0]!.gain.value).toBeCloseTo(MASTER_GAIN_CAP);
    eng.apply({ outputMode: 'headphones', volume: 0.5, balance: 0 });
    expect(gains[0]!.gain.value).toBeCloseTo(MASTER_GAIN_CAP * 0.5);
    eng.apply({ outputMode: 'headphones', volume: -1, balance: 0 });
    expect(gains[0]!.gain.value).toBe(0);
  });

  it('Einstellungen vor dem Start werden beim Start übernommen', async () => {
    const { ctx, gains } = fakeContext('running');
    const eng = new AudioEngine(() => ctx as unknown as AudioContext);
    eng.apply({ outputMode: 'speakers', volume: 0.4, balance: 0 });
    await eng.ensureRunning();
    expect(gains[0]!.gain.value).toBeCloseTo(MASTER_GAIN_CAP * 0.4);
  });

  it('Kopfhörer nutzen HRTF-Panner, Lautsprecher StereoPanner', async () => {
    const { ctx } = fakeContext('running');
    const eng = new AudioEngine(() => ctx as unknown as AudioContext);
    await eng.ensureRunning();
    eng.apply({ outputMode: 'headphones', volume: 0.5, balance: 0 });
    eng.scheduleBurst({ pos: { side: 'L', eccDeg: 10, angleDeg: 0 }, gainDb: 0, atSec: 1, rampMs: 150, plateauMs: 300 });
    expect(ctx.createPanner).toHaveBeenCalledTimes(1);
    eng.apply({ outputMode: 'speakers', volume: 0.5, balance: 0 });
    eng.scheduleBurst({ pos: { side: 'L', eccDeg: 10, angleDeg: 0 }, gainDb: 0, atSec: 2, rampMs: 150, plateauMs: 300 });
    expect(ctx.createStereoPanner).toHaveBeenCalledTimes(1);
  });
});

describe('initialVolume', () => {
  it('höchstens 0,5', () => {
    expect(initialVolume(0.9)).toBe(0.5);
    expect(initialVolume(null)).toBe(0.5);
    expect(initialVolume(0.3)).toBe(0.3);
  });
});
