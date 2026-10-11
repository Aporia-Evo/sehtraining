// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResponseInput } from '../../src/io/input';

function pointerDown(target: EventTarget): Event {
  // jsdom kennt PointerEvent nicht in allen Versionen; ein Event mit passendem Typ genügt
  const ev = new Event('pointerdown', { bubbles: true, cancelable: true });
  target.dispatchEvent(ev);
  return ev;
}

describe('ResponseInput', () => {
  let target: HTMLDivElement;
  let input: ResponseInput;
  let cb: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
    input = new ResponseInput(target);
    cb = vi.fn();
  });
  afterEach(() => {
    input.dispose();
    target.remove();
  });

  it('ohne arm keine Meldung', () => {
    pointerDown(target);
    expect(cb).not.toHaveBeenCalled();
  });

  it('nach arm genau eine Meldung mit Zeitstempel des Ereignisses', () => {
    input.arm(cb);
    const ev = pointerDown(target);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ timeMs: ev.timeStamp, source: 'pointer' });
  });

  it('pointerdown verhindert Standardverhalten', () => {
    input.arm(cb);
    expect(pointerDown(target).defaultPrevented).toBe(true);
  });

  it('pointerdown, mousedown, zweites pointerdown → eine Meldung', () => {
    input.arm(cb);
    pointerDown(target);
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    pointerDown(target);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('Tastendruck meldet source key', () => {
    input.arm(cb);
    target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ source: 'key' }));
  });

  it('gehaltene Taste (repeat) wird ignoriert', () => {
    input.arm(cb);
    target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }));
    expect(cb).not.toHaveBeenCalled();
  });

  it('disarm nach arm → keine Meldung', () => {
    input.arm(cb);
    input.disarm();
    pointerDown(target);
    expect(cb).not.toHaveBeenCalled();
  });

  it('erneutes arm erlaubt wieder eine Meldung', () => {
    input.arm(cb);
    pointerDown(target);
    input.arm(cb);
    pointerDown(target);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('dispose entfernt die Listener', () => {
    input.arm(cb);
    input.dispose();
    pointerDown(target);
    expect(cb).not.toHaveBeenCalled();
  });
});
