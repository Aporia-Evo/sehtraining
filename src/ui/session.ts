/** Ablauf mehrerer Durchgänge hintereinander und Hilfen für Sitzungen. */
import type { TrialPlan, TrialRecord } from '../core/types';
import type { Db } from '../store/db';
import { runTrial, type RunnerDeps } from './runner';

/** Lokales Datum als YYYY-MM-DD (für das Tageslimit und Vergleiche mit gestern). */
export function dayKey(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Spielt Durchgänge ab und speichert jeden sofort. Bei einem Abbruch endet der Block mit den bisherigen Datensätzen. */
export async function runBlock(args: {
  db: Db;
  planner: { next(): TrialPlan };
  deps: RunnerDeps;
  sessionId: string;
  trials: number;
  nowIso(): string;
  onTrial?(r: TrialRecord): void;
}): Promise<TrialRecord[]> {
  const out: TrialRecord[] = [];
  for (let i = 0; i < args.trials; i++) {
    const plan = args.planner.next();
    const rec = await runTrial(plan, args.deps, args.nowIso());
    await args.db.addTrial(rec);
    out.push(rec);
    args.onTrial?.(rec);
    if (rec.outcome === 'aborted') break;
  }
  return out;
}
