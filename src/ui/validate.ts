/** Eingabeprüfung für die Einrichtung. */

const CM_MESSAGE = 'Bitte einen Wert zwischen 10 und 200 cm eingeben.';

/** Zentimeterwert mit Komma oder Punkt als Dezimaltrenner, 10–200 cm. */
export function parseCm(input: string): { ok: true; value: number } | { ok: false; message: string } {
  const s = input.trim();
  if (!/^\d+([.,]\d+)?$/.test(s)) return { ok: false, message: CM_MESSAGE };
  const value = Number(s.replace(',', '.'));
  if (!(value >= 10 && value <= 200)) return { ok: false, message: CM_MESSAGE };
  return { ok: true, value };
}
