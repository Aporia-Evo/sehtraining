/** Export und Wiederherstellung (Stand M1 ohne PIN, nur über #/export erreichbar). */
import { useState } from 'preact/hooks';
import type { Db } from '../../store/db';
import { exportAll, importAll, shareOrDownload, trialsToCsv, EXPORT_SCHEMA } from '../../store/exportData';
import { dayKey } from '../session';

export function ExportPage(props: { db: Db; onImported(): void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<{ bundle: unknown; sessions: number; trials: number } | null>(null);
  const stamp = dayKey(new Date());

  const exportJson = async () => {
    const bundle = await exportAll(props.db, new Date().toISOString());
    await shareOrDownload(`sehtraining-${stamp}.json`, 'application/json', JSON.stringify(bundle, null, 1));
  };

  const exportCsv = async () => {
    const trials = await props.db.listTrials();
    trials.sort((a, b) => a.startedAtIso.localeCompare(b.startedAtIso) || a.index - b.index);
    await shareOrDownload(`sehtraining-${stamp}.csv`, 'text/csv', trialsToCsv(trials));
  };

  const pickFile = async (file: File | undefined) => {
    setMessage(null);
    if (!file) return;
    try {
      const bundle = JSON.parse(await file.text()) as { schema?: string; sessions?: unknown[]; trials?: unknown[] };
      if (bundle.schema !== EXPORT_SCHEMA || !Array.isArray(bundle.sessions) || !Array.isArray(bundle.trials)) {
        setMessage('Unbekanntes Format: Das ist keine Sicherung dieser App.');
        return;
      }
      setPending({ bundle, sessions: bundle.sessions.length, trials: bundle.trials.length });
    } catch {
      setMessage('Die Datei konnte nicht gelesen werden.');
    }
  };

  const confirmImport = async () => {
    if (!pending) return;
    try {
      const r = await importAll(props.db, pending.bundle);
      setMessage(`Eingespielt: ${r.sessions} Sitzungen, ${r.trials} Durchgänge.`);
      setPending(null);
      props.onImported();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  return (
    <div class="admin screen">
      <h1>Daten sichern</h1>
      <p class="hint">
        Alle Daten liegen nur auf diesem iPad. Wird die App gelöscht, sind sie weg. Deshalb regelmäßig sichern, zum Beispiel per AirDrop
        oder Mail an dich. Sicherungen nie in das öffentliche Repository legen.
      </p>
      <button class="primary" onClick={() => void exportJson()}>
        Alles sichern (JSON)
      </button>
      <button onClick={() => void exportCsv()}>Durchgänge als Tabelle (CSV)</button>

      <h1 style={{ marginTop: '32px' }}>Sicherung einspielen</h1>
      <input type="file" accept="application/json,.json" onChange={(e) => void pickFile(e.currentTarget.files?.[0])} />
      {pending && (
        <p>
          {pending.sessions} Sitzungen, {pending.trials} Durchgänge – vorhandene Daten werden ersetzt.
          <br />
          <button class="primary" onClick={() => void confirmImport()}>
            Ersetzen
          </button>
          <button onClick={() => setPending(null)}>Abbrechen</button>
        </p>
      )}
      {message && <p>{message}</p>}

      <h1 style={{ marginTop: '32px' }}>Weiteres</h1>
      <button onClick={() => (location.hash = '#/setup')}>Einrichtung wiederholen</button>
      <button onClick={() => (location.hash = '#/test')}>Testseite</button>
      <button onClick={() => (location.hash = '#/')}>Zum Start</button>
    </div>
  );
}
