/**
 * Startbildschirm für ihn: ein großer Knopf rechts von der Mitte; ein Tippen irgendwo startet ebenfalls.
 * Bewusst onClick: iOS schaltet Audio nur bei pointerup/touchend/click frei, nicht bei pointerdown.
 */
export function StartScreen(props: { onStart(): void }) {
  return (
    <div class="patient screen start-screen" onClick={() => props.onStart()}>
      <button class="start-button" aria-label="Start">
        Start
      </button>
    </div>
  );
}
