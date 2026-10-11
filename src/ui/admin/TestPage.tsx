/** Testseite: einzelne Reize mit wählbarer Stufe, Ort und Ton zeigen (Spec 12). */
import { useState } from 'preact/hooks';
import { LEVEL_COUNT, PLATEAU_MS, RAMP_MS, levelParams } from '../../core/stimulus';
import type { Side, SoundCondition, TrialRecord } from '../../core/types';
import { checkTrialPlan } from '../../core/safety';
import type { AudioEngine } from '../../io/audio';
import type { Settings } from '../../store/db';
import { runTrial } from '../runner';
import { TrialStage } from '../TrialStage';

export function TestPage(props: { audio: AudioEngine; settings: Settings }) {
  const [level, setLevel] = useState(6);
  const [side, setSide] = useState<Side>('L');
  const [ecc, setEcc] = useState(8);
  const [angle, setAngle] = useState(0);
  const [sound, setSound] = useState<SoundCondition>('sync');
  const [running, setRunning] = useState(0);
  const [result, setResult] = useState<TrialRecord | null>(null);
  const p = levelParams(level);

  const plan = {
    id: `test-${running}`,
    sessionId: 'test',
    index: running,
    kind: side === 'L' ? ('left' as const) : ('right' as const),
    pos: { side, eccDeg: ecc, angleDeg: angle },
    gridPointId: null,
    level,
    sound,
    soaMs: 0,
    soundGainDb: 0,
    waitMs: 1000,
    rampMs: RAMP_MS,
    plateauMs: PLATEAU_MS,
    responseWindowMs: 2000,
    phase: 'test',
  };
  const errors = checkTrialPlan(plan);

  if (running > 0) {
    return (
      <TrialStage
        key={running}
        geometry={props.settings.geometry!}
        audio={props.audio}
        run={async (deps) => {
          const r = await runTrial(plan, deps, new Date().toISOString());
          setResult(r);
          setRunning(0);
        }}
      />
    );
  }

  return (
    <div class="admin screen">
      <h1>Testseite</h1>
      <label>
        Stufe {level} (Kontrast {p.contrast.toFixed(2)}, σ {p.sigmaDeg.toFixed(2)}°)
        <br />
        <input type="range" min={0} max={LEVEL_COUNT - 1} step={1} value={level} onInput={(e) => setLevel(Number(e.currentTarget.value))} />
      </label>
      <label>
        Seite:{' '}
        <select value={side} onChange={(e) => setSide(e.currentTarget.value as Side)}>
          <option value="L">links</option>
          <option value="R">rechts</option>
        </select>
      </label>
      <label>
        Exzentrizität {ecc}°
        <br />
        <input type="range" min={1} max={40} step={1} value={ecc} onInput={(e) => setEcc(Number(e.currentTarget.value))} />
      </label>
      <label>
        Winkel {angle}° (+90 oben, −90 unten)
        <br />
        <input type="range" min={-90} max={90} step={15} value={angle} onInput={(e) => setAngle(Number(e.currentTarget.value))} />
      </label>
      <label>
        Ton:{' '}
        <select value={sound} onChange={(e) => setSound(e.currentTarget.value as SoundCondition)}>
          <option value="none">keiner</option>
          <option value="sync">gleichzeitig</option>
        </select>
      </label>
      {errors.length > 0 && <p class="error">{errors.join(' ')}</p>}
      <button
        class="primary"
        disabled={errors.length > 0}
        onClick={async () => {
          await props.audio.ensureRunning();
          props.audio.apply(props.settings.audio);
          setRunning(Date.now());
        }}
      >
        Reiz zeigen
      </button>
      <button onClick={() => (location.hash = '#/export')}>Zurück</button>
      {result && (
        <p>
          Ergebnis: {result.outcome}
          {result.rtMs !== null ? `, Reaktionszeit ${Math.round(result.rtMs)} ms` : ''}
        </p>
      )}
    </div>
  );
}
