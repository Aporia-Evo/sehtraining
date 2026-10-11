/** Vollbild-Canvas, auf dem Durchgänge laufen. Ruft run() einmal mit fertigen Runner-Abhängigkeiten auf. */
import { useEffect, useRef } from 'preact/hooks';
import type { GeometryInput } from '../core/geometry';
import type { AudioEngine } from '../io/audio';
import { ResponseInput } from '../io/input';
import { createBrowserDeps } from './browserDeps';
import type { RunnerDeps } from './runner';

export function TrialStage(props: { geometry: GeometryInput; audio: AudioEngine; run(deps: RunnerDeps): Promise<void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const input = new ResponseInput(window);
    const deps = createBrowserDeps({ canvas: canvasRef.current!, audio: props.audio, input, geometry: props.geometry });
    void props.run(deps);
    return () => input.dispose();
    // run() genau einmal pro Einblendung der Bühne
  }, []);
  return (
    <div class="stage">
      <canvas ref={canvasRef} />
    </div>
  );
}
