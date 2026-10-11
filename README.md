# Sehtraining

Audiovisuelles Heimtraining bei Hemianopsie nach links, als Web-App für das iPad. Die App läuft nach der Installation offline. Alle Trainingsdaten bleiben auf dem iPad.

> **Hinweis:** Diese App ist kein Medizinprodukt und stellt keine Diagnosen. Sie ergänzt ein ärztlich begleitetes Training und ersetzt es nicht.

Stand: Meilenstein 1 (Grundgerüst). Es gibt einen Trainingsblock mit 20 Durchgängen auf fester mittlerer Reizstärke. Karte, Treppenregel, Phasen, Sprachansagen und PIN-Bereich folgen in den nächsten Meilensteinen. Das fachliche Design steht in `docs/superpowers/specs/2026-10-11-sehtraining-design.md`.

## Installation auf dem iPad

1. In Safari `https://aporia-evo.github.io/sehtraining/` öffnen.
2. Auf „Teilen“ tippen und „Zum Home-Bildschirm“ wählen.
3. Die App ab jetzt nur über das neue Symbol auf dem Home-Bildschirm starten. Nur so läuft sie offline und im Vollbild, und nur dort bleiben die Daten erhalten.

Updates kommen automatisch, wenn das iPad beim Start Internet hat.

## iPad vorbereiten

- **Helligkeit:** Einstellungen → Anzeige & Helligkeit: „True Tone“ aus, „Automatisch“ (unter Bedienungshilfen → Anzeige & Textgröße) aus, Helligkeit fest auf einen mittleren Wert. Sonst ändern sich die Reizstärken von Tag zu Tag.
- **Lautstärke:** etwa auf die Hälfte. Die App begrenzt ihre eigene Lautstärke zusätzlich.
- **Halterung:** das iPad quer in eine stabile Halterung, immer im gleichen Abstand zu den Augen (Standard 30 cm). Den Abstand gibst du bei der Einrichtung ein.
- **Geführter Zugriff:** Einstellungen → Bedienungshilfen → Geführter Zugriff einschalten. In der App dreimal die Seitentaste drücken, dann kann er die App nicht versehentlich verlassen.

## Einrichtung

Beim ersten Start öffnet sich der Einrichtungsassistent. Später erreichst du ihn über `#/export` → „Einrichtung wiederholen“.

1. **Hinweis** „kein Medizinprodukt“ lesen und bestätigen. Ohne Bestätigung startet kein Training.
2. **Bildschirm und Abstand:** die sichtbare Bildbreite mit dem Lineal messen (Komma erlaubt, z. B. „24,5“) und den Abstand Augen–Bildschirm eintragen. Der Schieber setzt das Fixationskreuz nach rechts, damit links mehr Platz ist (Standard 67 %). Darunter steht, wie weit das Bild in Grad reicht.
3. **Ton:** Kopfhörer (empfohlen) oder iPad-Lautsprecher wählen, links und rechts testen, Lautstärke und Balance so einstellen, dass beide Seiten für ihn gleich laut sind.
4. **Reaktionszeit rechts:** 20 kurze Durchgänge ohne Ton im sehenden rechten Feld. Daraus berechnet die App, wie lange sie nach einem Licht auf sein Tippen wartet (zwischen 1,5 und 3 Sekunden).

## Tägliche Nutzung

Stand M1: Auf dem Startbildschirm auf „Start“ tippen (oder irgendwo). Er schaut auf das Kreuz und tippt auf den Bildschirm, sobald er ein Licht sieht. Nach 20 Durchgängen erscheint „Heute X von Y gefunden.“ Wird die App verlassen oder das iPad gedreht, pausiert das Training; ein Tippen setzt es fort.

Sprachansagen, Pausen alle 5 Minuten, 30-Minuten-Sitzungen und das Tageslimit kommen mit Meilenstein 3.

## Datenexport

Die Seite `https://aporia-evo.github.io/sehtraining/#/export` (in M1 noch ohne PIN, nur über die Adresse erreichbar):

- **Alles sichern (JSON):** vollständige Sicherung aller Einstellungen, Sitzungen und Durchgänge. Auf dem iPad öffnet sich das Teilen-Menü (AirDrop, Mail, Dateien).
- **Durchgänge als Tabelle (CSV):** eine Zeile pro Durchgang, Semikolon-getrennt, öffnet direkt in Excel.
- **Sicherung einspielen:** eine JSON-Sicherung auswählen. Die vorhandenen Daten werden nach Rückfrage ersetzt.

Dort gibt es auch eine **Testseite**, auf der du einzelne Reize mit wählbarer Stufe, Ort und Ton ansehen kannst.

## Datenschutz

- Kein Server, keine Cloud, keine Telemetrie. Die App lädt zur Laufzeit nichts aus dem Internet.
- Trainingsdaten, Fotos und Aufnahmen liegen nur im Speicher der App auf dem iPad.
- **Wird die App vom iPad gelöscht, sind die Daten weg.** Deshalb regelmäßig exportieren.
- Exporte **nie** in dieses Repository legen. Es ist öffentlich.

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests
npm run typecheck  # TypeScript-Prüfung
npm run build      # Produktions-Build nach dist/
npm run icons      # App-Icons neu erzeugen
```

Ein Push auf `main` testet, baut und veröffentlicht die App über GitHub Pages (Repo-Einstellungen → Pages → Quelle „GitHub Actions“).
