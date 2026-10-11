/** Startbildschirm für ihn: ein großer Knopf rechts von der Mitte; ein Tippen irgendwo startet ebenfalls. */
export function StartScreen(props: { onStart(): void }) {
  return (
    <div class="patient screen start-screen" onPointerDown={() => props.onStart()}>
      <button class="start-button" aria-label="Start">
        Start
      </button>
    </div>
  );
}
