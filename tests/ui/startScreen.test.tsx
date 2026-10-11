// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from 'preact';
import { StartScreen } from '../../src/ui/patient/StartScreen';
import { unlockAudio } from '../../src/ui/unlockAudio';

describe('StartScreen', () => {
  it('startet bei click (iOS: Audio nur bei pointerup/touchend/click freischaltbar), nicht bei pointerdown', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />, root);
    const screen = root.querySelector('.start-screen')!;
    screen.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onStart).not.toHaveBeenCalled();
    screen.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onStart).toHaveBeenCalledTimes(1);
    render(null, root);
    root.remove();
  });
});

describe('unlockAudio', () => {
  it('blockiert nicht und schluckt Fehler, wenn resume hängt oder scheitert', async () => {
    const hanging = { ensureRunning: () => new Promise<void>(() => undefined) };
    const failing = { ensureRunning: () => Promise.reject(new Error('NotAllowedError')) };
    expect(unlockAudio(hanging)).toBeUndefined();
    expect(unlockAudio(failing)).toBeUndefined();
    await new Promise((r) => setTimeout(r, 0)); // keine unbehandelte Ablehnung
  });
});
