/** Lokale Speicherung in IndexedDB (Spec 12). Nichts verlässt das Gerät. */
import { openDB, type IDBPDatabase } from 'idb';
import type { GeometryInput } from '../core/geometry';
import type { TrialRecord } from '../core/types';
import type { AudioSettings } from '../io/audio';

export const DB_NAME = 'sehtraining';
export const DB_VERSION = 1;

export interface Settings {
  disclaimerAcceptedAt: string | null;
  geometry: GeometryInput | null;
  audio: AudioSettings;
  referenceRtsMs: number[];
  responseWindowMs: number | null;
  /** Fenstergröße (CSS-Pixel) bei der Einrichtung; die Bildbreite in cm gilt nur für genau diese Größe. */
  setupViewport: { width: number; height: number } | null;
}

export const DEFAULT_SETTINGS: Settings = {
  disclaimerAcceptedAt: null,
  geometry: null,
  audio: { outputMode: 'headphones', volume: 0.5, balance: 0 },
  referenceRtsMs: [],
  responseWindowMs: null,
  setupViewport: null,
};

/** Startwerte für die Geometrie im Einrichtungsassistenten. */
export const DEFAULT_GEOMETRY: GeometryInput = {
  screenWidthCm: 24,
  viewingDistanceCm: 30,
  fixationXFraction: 2 / 3,
  fixationYFraction: 0.5,
};

export interface SessionRecord {
  id: string;
  startedAtIso: string;
  endedAtIso: string | null;
  /** Lokales Datum YYYY-MM-DD. */
  dayKey: string;
  kind: 'training' | 'reference';
  trialCount: number;
}

export interface Db {
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  addSession(s: SessionRecord): Promise<void>;
  updateSession(s: SessionRecord): Promise<void>;
  listSessions(): Promise<SessionRecord[]>;
  addTrial(t: TrialRecord): Promise<void>;
  listTrials(sessionId?: string): Promise<TrialRecord[]>;
  clearAll(): Promise<void>;
  /** Ersetzt alle Daten in einer einzigen Transaktion: entweder alles oder nichts. */
  replaceAll(data: { settings: Settings; sessions: SessionRecord[]; trials: TrialRecord[] }): Promise<void>;
}

const SETTINGS_KEY = 'main';

export async function openDb(name: string = DB_NAME): Promise<Db> {
  const idb: IDBPDatabase = await openDB(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('settings');
        db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('dayKey', 'dayKey');
        db.createObjectStore('trials', { keyPath: 'id' }).createIndex('sessionId', 'sessionId');
      }
    },
  });

  return {
    async getSettings() {
      const s = (await idb.get('settings', SETTINGS_KEY)) as Settings | undefined;
      return s ? { ...DEFAULT_SETTINGS, ...s } : structuredClone(DEFAULT_SETTINGS);
    },
    async saveSettings(s) {
      await idb.put('settings', s, SETTINGS_KEY);
    },
    async addSession(s) {
      await idb.add('sessions', s);
    },
    async updateSession(s) {
      await idb.put('sessions', s);
    },
    async listSessions() {
      return (await idb.getAll('sessions')) as SessionRecord[];
    },
    async addTrial(t) {
      await idb.add('trials', t);
    },
    async listTrials(sessionId) {
      const rows = sessionId === undefined ? await idb.getAll('trials') : await idb.getAllFromIndex('trials', 'sessionId', sessionId);
      return rows as TrialRecord[];
    },
    async clearAll() {
      const tx = idb.transaction(['settings', 'sessions', 'trials'], 'readwrite');
      await Promise.all([tx.objectStore('settings').clear(), tx.objectStore('sessions').clear(), tx.objectStore('trials').clear(), tx.done]);
    },
    async replaceAll(data) {
      const tx = idb.transaction(['settings', 'sessions', 'trials'], 'readwrite');
      const settings = tx.objectStore('settings');
      const sessions = tx.objectStore('sessions');
      const trials = tx.objectStore('trials');
      try {
        await Promise.all([settings.clear(), sessions.clear(), trials.clear()]);
        await settings.put(data.settings, SETTINGS_KEY);
        for (const s of data.sessions) await sessions.add(s);
        for (const t of data.trials) await trials.add(t);
        await tx.done;
      } catch (e) {
        try {
          tx.abort();
        } catch {
          // Transaktion ist bereits abgebrochen
        }
        await tx.done.catch(() => undefined);
        throw e;
      }
    },
  };
}
