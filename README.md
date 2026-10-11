# Sehtraining

Audiovisuelles Heimtraining bei Hemianopsie nach links, als Web-App für das iPad. Die App läuft nach der Installation offline. Alle Trainingsdaten bleiben auf dem iPad.

> **Hinweis:** Diese App ist kein Medizinprodukt und stellt keine Diagnosen. Sie ergänzt ein ärztlich begleitetes Training und ersetzt es nicht.

Stand: Meilenstein 1 (Grundgerüst) in Arbeit. Das fachliche Design steht in `docs/superpowers/specs/2026-10-11-sehtraining-design.md`.

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

Folgt mit Meilenstein 1.

## Tägliche Nutzung

Folgt mit Meilenstein 3.

## Datenexport

Folgt mit Meilenstein 1.

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
