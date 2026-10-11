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

const hasStringId = (r: unknown, key: string): boolean =>
  typeof r === 'object' && r !== null && typeof (r as Record<string, unknown>)[key] === 'string';

function isBundle(x: unknown): x is ExportBundle {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Partial<ExportBundle>;
  return (
    b.schema === EXPORT_SCHEMA &&
    typeof b.settings === 'object' &&
    b.settings !== null &&
    Array.isArray(b.sessions) &&
    Array.isArray(b.trials) &&
    b.sessions.every((s) => hasStringId(s, 'id')) &&
    b.trials.every((t) => hasStringId(t, 'id') && hasStringId(t, 'sessionId'))
  );
}

/** Ersetzt alle vorhandenen Daten durch den Inhalt der Sicherung – atomar: bei einem Fehler bleibt alles beim Alten. */
export async function importAll(db: Db, bundle: unknown): Promise<{ sessions: number; trials: number }> {
  if (!isBundle(bundle)) throw new Error('Unbekanntes Format: Das ist keine Sicherung dieser App.');
  await db.replaceAll({ settings: bundle.settings, sessions: bundle.sessions, trials: bundle.trials });
  return { sessions: bundle.sessions.length, trials: bundle.trials.length };
}

export const CSV_COLUMNS = [
  'id', 'sessionId', 'index', 'startedAtIso', 'kind', 'side', 'eccDeg', 'angleDeg', 'gridPointId', 'level',
  'contrast', 'sigmaDeg', 'sound', 'soaMs', 'soundGainDb', 'waitMs', 'responseWindowMs', 'phase', 'outcome',
  'rtMs', 'soundPlayed', 'fixationOk', 'abortReason',
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

/**
 * Teilen-Menü (iPad: AirDrop, Mail, Dateien), sonst normaler Download.
 * Direkt aus dem Tipp-Handler aufrufen, ohne vorheriges await: Safari verlangt eine frische Nutzergeste.
 */
export async function shareOrDownload(file: File): Promise<void> {
  const filename = file.name;
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
