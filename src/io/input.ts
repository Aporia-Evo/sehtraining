/** Antworteingabe: Tippen irgendwo auf den Bildschirm oder ein Tastendruck (z. B. Buzzer als Tastatur). */

export interface ResponseEvent {
  /** event.timeStamp – gleiche Zeitachse wie performance.now(). */
  timeMs: number;
  source: 'pointer' | 'key';
}

/** Sperrzeit nach einer angenommenen Antwort: Doppeltippen und prellende Taster zählen nicht für den nächsten Durchgang. */
export const REFRACTORY_MS = 250;

export class ResponseInput {
  private callback: ((e: ResponseEvent) => void) | null = null;
  private lastAcceptedMs = -Infinity;

  private readonly onPointer = (ev: Event): void => {
    // Unterdrückt Kompatibilitäts-Mausereignisse, Zoom und Textauswahl
    if (ev.cancelable) ev.preventDefault();
    this.emit({ timeMs: ev.timeStamp, source: 'pointer' });
  };

  private readonly onKey = (ev: Event): void => {
    if ((ev as KeyboardEvent).repeat) return;
    this.emit({ timeMs: ev.timeStamp, source: 'key' });
  };

  constructor(private readonly target: EventTarget) {
    target.addEventListener('pointerdown', this.onPointer, { capture: true });
    target.addEventListener('keydown', this.onKey, { capture: true });
  }

  /** Nimmt genau eine Antwort bis zum nächsten arm() an. */
  arm(onResponse: (e: ResponseEvent) => void): void {
    this.callback = onResponse;
  }

  disarm(): void {
    this.callback = null;
  }

  dispose(): void {
    this.callback = null;
    this.target.removeEventListener('pointerdown', this.onPointer, { capture: true });
    this.target.removeEventListener('keydown', this.onKey, { capture: true });
  }

  private emit(e: ResponseEvent): void {
    const cb = this.callback;
    if (!cb) return;
    if (e.timeMs - this.lastAcceptedMs < REFRACTORY_MS) return;
    this.lastAcceptedMs = e.timeMs;
    this.callback = null;
    cb(e);
  }
}
