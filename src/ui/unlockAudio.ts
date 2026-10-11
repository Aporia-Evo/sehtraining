/**
 * Audio freischalten, ohne den Ablauf daran zu hängen: Aufruf aus einem click-Handler
 * (iOS akzeptiert nur pointerup/touchend/click als Geste), Ergebnis wird nicht abgewartet.
 */
export function unlockAudio(audio: { ensureRunning(): Promise<void> }): void {
  try {
    audio.ensureRunning().catch(() => undefined);
  } catch {
    // Kontext konnte nicht erzeugt werden – Training läuft dann ohne Ton weiter
  }
}
