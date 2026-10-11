/** Training (Stand M1): ein Block mit 20 Durchgängen, Phase 1 fest, danach „Heute X von Y gefunden.“ */
import { useRef, useState } from 'preact/hooks';
import { createBasicPlanner } from '../../core/blocks';
import { createRng } from '../../core/rng';
import { DEFAULT_WINDOW_MS } from '../../core/trial';
import type { TrialRecord } from '../../core/types';
import type { AudioEngine } from '../../io/audio';
import type { Db, SessionRecord, Settings } from '../../store/db';
import { currentGeometry, isLandscape } from '../browserDeps';
import { blockSummary } from '../routing';
import { dayKey, newId, runBlock } from '../session';
import { TrialStage } from '../TrialStage';
import { unlockAudio } from '../unlockAudio';

export const M1_BLOCK_TRIALS = 20;

type View = { kind: 'running'; run: number } | { kind: 'paused' } | { kind: 'summary'; found: number; total: number };

export function TrainingScreen(props: { db: Db; audio: AudioEngine; settings: Settings; onExit(): void }) {
  const geometry = props.settings.geometry!;
  const [view, setView] = useState<View>(() => (isLandscape() ? { kind: 'running', run: 0 } : { kind: 'paused' }));
  const records = useRef<TrialRecord[]>([]);
  const session = useRef<SessionRecord | null>(null);
  const planner = useRef<ReturnType<typeof createBasicPlanner> | null>(null);

  const ensureSession = async (): Promise<SessionRecord> => {
    if (!session.current) {
      const now = new Date();
      session.current = { id: newId(), startedAtIso: now.toISOString(), endedAtIso: null, dayKey: dayKey(now), kind: 'training', trialCount: 0 };
      await props.db.addSession(session.current);
      planner.current = createBasicPlanner(createRng(Date.now() >>> 0), {
        sessionId: session.current.id,
        geometry: currentGeometry(geometry),
        responseWindowMs: props.settings.responseWindowMs ?? DEFAULT_WINDOW_MS,
      });
    }
    return session.current;
  };

  const resume = () => {
    if (!isLandscape()) return;
    unlockAudio(props.audio);
    setView({ kind: 'running', run: Date.now() });
  };

  if (view.kind === 'running') {
    return (
      <TrialStage
        key={view.run}
        geometry={geometry}
        audio={props.audio}
        run={async (deps) => {
          const s = await ensureSession();
          const done = records.current.filter((r) => r.outcome !== 'aborted').length;
          const recs = await runBlock({
            db: props.db,
            planner: planner.current!,
            deps,
            sessionId: s.id,
            trials: M1_BLOCK_TRIALS - done,
            nowIso: () => new Date().toISOString(),
            onTrial: (r) => {
              if (r.outcome === 'hit') props.audio.playChime();
            },
          });
          records.current.push(...recs);
          s.trialCount = records.current.length;
          if (recs.at(-1)?.outcome === 'aborted') {
            await props.db.updateSession(s);
            setView({ kind: 'paused' });
            return;
          }
          s.endedAtIso = new Date().toISOString();
          await props.db.updateSession(s);
          setView({ kind: 'summary', ...blockSummary(records.current) });
        }}
      />
    );
  }

  if (view.kind === 'paused') {
    return (
      <div class="patient screen overlay-message" onClick={resume}>
        {isLandscape() ? 'Pause. Tippe zum Weitermachen.' : 'Bitte das iPad quer halten.'}
      </div>
    );
  }

  return (
    <div class="patient screen summary" onClick={props.onExit}>
      <div>
        Heute {view.found} von {view.total} gefunden.
      </div>
      <small>Tippe, um zurückzugehen.</small>
    </div>
  );
}
