/** Export als JSON (vollständig) und CSV (Durchgänge), Import zur Wiederherstellung (Spec 12). */
import type { TrialRecord } from '../core/types';
import type { Db, SessionRecord, Settings } from './db';

export const EXPORT_SCHEMA = 'sehtraining-export/1';

export interface ExportBundle {
  schema: typeof EXPORT_SCHEMA;
  exportedAtIso: string;
  settings: Settings;
  sessions: SessionRecord[];
  trials: TrialRecord[];
}

export async function exportAll(db: Db, nowIso: string): Promise<ExportBundle> {
  return {
    schema: EXPORT_SCHEMA,
    exportedAtIso: nowIso,
    settings: await db.getSettings(),
    sessions: await db.listSessions(),
    trials: await db.listTrials(),
  };
}

function isBundle(x: unknown): x is ExportBundle {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Partial<ExportBundle>;
  return b.schema === EXPORT_SCHEMA && typeof b.settings === 'object' && Array.isArray(b.sessions) && Array.isArray(b.trials);
}

/** Ersetzt alle vorhandenen Daten durch den Inhalt der Sicherung. */
export async function importAll(db: Db, bundle: unknown): Promise<{ sessions: number; trials: number }> {
  if (!isBundle(bundle)) throw new Error('Unbekanntes Format: Das ist keine Sicherung dieser App.');
  await db.clearAll();
  await db.saveSettings(bundle.settings);
  for (const s of bundle.sessions) await db.addSession(s);
  for (const t of bundle.trials) await db.addTrial(t);
  return { sessions: bundle.sessions.length, trials: bundle.trials.length };
}

export const CSV_COLUMNS = [
  'id', 'sessionId', 'index', 'startedAtIso', 'kind', 'side', 'eccDeg', 'angleDeg', 'gridPointId', 'level',
  'contrast', 'sigmaDeg', 'sound', 'soaMs', 'soundGainDb', 'waitMs', 'responseWindowMs', 'phase', 'outcome',
  'rtMs', 'fixationOk', 'abortReason',
] as const;

type Column = (typeof CSV_COLUMNS)[number];

function cell(t: TrialRecord, c: Column): string | number | boolean | null {
  switch (c) {
    case 'side':
      return t.pos?.side ?? null;
    case 'eccDeg':
      return t.pos?.eccDeg ?? null;
    case 'angleDeg':
      return t.pos?.angleDeg ?? null;
    default:
      return t[c];
  }
}

function escapeCsv(v: string | number | boolean | null): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Semikolon-getrennt, Dezimalpunkt, UTF-8 mit BOM (Excel öffnet so direkt). */
export function trialsToCsv(trials: TrialRecord[]): string {
  const lines = [CSV_COLUMNS.join(';'), ...trials.map((t) => CSV_COLUMNS.map((c) => escapeCsv(cell(t, c))).join(';'))];
  return '﻿' + lines.join('\r\n') + '\r\n';
}

/** Teilen-Menü (iPad: AirDrop, Mail, Dateien), sonst normaler Download. */
export async function shareOrDownload(filename: string, mime: string, content: string): Promise<void> {
  const file = new File([content], filename, { type: mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
