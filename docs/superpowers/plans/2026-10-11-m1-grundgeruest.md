# Meilenstein 1 – Grundgerüst, Geometrie, Durchgang, Speicherung – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine installierbare Offline-PWA, die nach einer Einrichtung (Hinweis, Geometrie, Audio, Reaktionszeit) Durchgänge mit Licht und Ton (Phase 1 fest, Ort zufällig) auf dem iPad abspielt, jeden Durchgang in IndexedDB speichert und als JSON/CSV exportiert.

**Architecture:** `src/core/` ist reine, deterministisch testbare Logik (keine DOM-, Audio- oder Uhr-Zugriffe; Zeit als Parameter, Zufall über `Rng`). `src/io/` kapselt Browser-APIs, `src/store/` IndexedDB, `src/ui/` Preact-Bildschirme. Der Durchgangs-Runner bekommt Uhr, Frame-Takt, Audio und Eingabe injiziert und ist so mit Fakes testbar.

**Tech Stack:** Vite 8, TypeScript 5.9 (strict), Preact 10.29 + @preact/preset-vite, Vitest 5 (+ jsdom, fake-indexeddb), idb 8, vite-plugin-pwa 2, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-10-11-sehtraining-design.md` (Abschnitte 2–6, 10, 11 teilweise, 12 teilweise, 17 Zeile M1)

## Global Constraints

- Repo `Aporia-Evo/sehtraining`, Arbeit direkt auf `main` (Push löst Deploy aus); Node 22 lokal und in CI.
- Vite `base: '/sehtraining/'` (Pages-URL `https://aporia-evo.github.io/sehtraining/`).
- Keine Netzwerkzugriffe zur Laufzeit: keine CDNs, keine externen Schriften, keine Telemetrie. Alle Assets im Precache.
- Code und Bezeichner englisch; alle sichtbaren Texte, README, Kommentare zu Fachlichem deutsch.
- `src/core/**` importiert nichts außerhalb `src/core/` und nutzt weder `window`, `document`, `performance`, `Date.now` noch `Math.random`.
- Hintergrund überall `#3c3c3c`, Text `#e0e0e0`; kein reines Schwarz oder Weiß. Bildschirmwechsel per 300 ms Überblendung (CSS `transition: opacity 300ms`).
- Lichtreiz: 150 ms Cosinus-Rampe hoch, 300 ms Plateau, 150 ms runter (gesamt 600 ms); Rampen ≥ 100 ms; ≥ 1000 ms zwischen Ende eines Reizes und Beginn des nächsten; σ ≤ 1,5°; Weber-Kontrast ≤ 4,0.
- Antwortfenster: Treffer bei 150 ms ≤ RT ≤ T; T = Median + 3·MAD der Referenz-RTs, begrenzt auf 1500–3000 ms; Standard-T ohne Referenz 2000 ms.
- Mischung je Block von 20: 14 links, 4 rechts, 2 ohne Reiz, gemischt.
- Referenzstufe 6; in M1 laufen alle Reize auf Stufe 6 (Treppe kommt in M2).
- Wartezeit vor dem Reiz gleichverteilt 1000–2500 ms.
- Kein Hinweis „kein Medizinprodukt“ → keine Nutzung: die App startet ohne bestätigten Hinweis immer im Einrichtungsassistenten.
- Audio-Master-Gain hat einen festen Deckel; Startwert höchstens 50 % des Deckels; Limiter vor dem Ausgang.
- Commits enden mit:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01B9jmXnutASjAupKvNwf4Pf
  ```

## Review Focus

1. **App kommt aus dem Hintergrund zurück** (Home-Taste, Sperrbildschirm): iOS setzt den `AudioContext` auf `interrupted`/`suspended`. Erwartet: das nächste Tippen auf „Start“ ruft `resume()` auf, Ton funktioniert wieder. → Test in Task 7 (`ensureRunning`).
2. **Sichtbarkeit wechselt mitten im Durchgang** (`visibilitychange` → hidden): Zeitmessung ist ungültig. Erwartet: Durchgang endet mit `aborted`, wird nicht als Verpasst gezählt, Sitzung pausiert. → Test in Task 10.
3. **Viewport ändert sich mitten im Durchgang** (Drehen ins Hochformat, Split View): Erwartet: Durchgang `aborted`, Hinweis „Bitte das iPad quer halten“, Geometrie wird neu berechnet. → Test in Task 10.
4. **Doppelte Eingaben** (Touch erzeugt `pointerdown` und Kompatibilitäts-`mousedown`, Buzzer prellt, Taste wird gehalten): Erwartet: pro Durchgang zählt nur die erste Eingabe, `repeat`-Tasten werden ignoriert. → Test in Task 8.
5. **Eingaben mit deutschem Komma oder unplausiblen Werten** („24,5“, Abstand 5 cm, Breite 0): Erwartet: Komma wird akzeptiert, Werte außerhalb 10–200 cm abgelehnt mit deutscher Meldung. → Test in Task 11.

---

## Dateistruktur

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, index.html, .gitignore
.github/workflows/deploy.yml
scripts/make-icons.mjs          erzeugt public/icons/*.png (Node zlib, keine Abhängigkeit)
public/icons/                   icon-180.png, icon-192.png, icon-512.png
src/main.tsx                    Einstieg, Router
src/styles.css                  Grundstil (Farben, Schrift, Überblendung)
src/core/types.ts               gemeinsame Typen
src/core/rng.ts                 seedbarer Zufall
src/core/geometry.ts            Grad ↔ Pixel
src/core/stimulus.ts            Stufen, Hüllkurve, Blob-Patch
src/core/safety.ts              Regelprüfung
src/core/trial.ts               Antwortklassifikation, Antwortfenster
src/core/blocks.ts              Blockmischung, M1-Planer
src/io/audio.ts                 AudioEngine
src/io/spatial.ts               Richtung → Azimut/Elevation, Pan (rein, testbar)
src/io/input.ts                 ResponseInput
src/store/db.ts                 IndexedDB (idb)
src/store/exportData.ts         JSON/CSV-Export, Import
src/ui/runner.ts                runTrial (injizierte Abhängigkeiten)
src/ui/StimulusCanvas.ts        Zeichnen auf Canvas
src/ui/setup/*.tsx              Einrichtungsassistent
src/ui/patient/*.tsx            Start, Training (M1: ein Block)
src/ui/admin/*.tsx              M1: Export-Seite, Testseite (noch ohne PIN)
src/ui/validate.ts              Eingabeprüfung Einrichtung
tests/**                        spiegelt src/
README.md
```

---

### Task 1: Projektgerüst, PWA, CI

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/styles.css`, `scripts/make-icons.mjs`, `public/icons/*`, `.github/workflows/deploy.yml`, `README.md`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: npm-Skripte `dev`, `build`, `preview`, `test` (`vitest run`), `typecheck` (`tsc --noEmit`), `icons` (`node scripts/make-icons.mjs`).

- [ ] **Step 1: Abhängigkeiten festlegen und installieren**

`dependencies`: `preact@^10.29.8`, `idb@^8.0.4`. `devDependencies`: `vite@^8.3.4`, `typescript@~5.9`, `@preact/preset-vite@^2.10.6`, `vitest@^5.0.3`, `jsdom`, `fake-indexeddb@^6.2.5`, `vite-plugin-pwa@^2.0.0`, `@types/node`. `"type": "module"`, `"engines": {"node": ">=22"}`.
Run: `npm install` → Expected: kein ERESOLVE-Fehler. Falls Peer-Konflikt: die gemeldete Version auf die letzte kompatible Minor setzen und im Commit nennen.

- [ ] **Step 2: Konfiguration**

- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `target ES2022`, `module ESNext`, `moduleResolution bundler`, `jsx react-jsx`, `jsxImportSource preact`, `types ["vite/client", "vite-plugin-pwa/client"]`, include `src`, `tests`.
- `vite.config.ts`: `base: '/sehtraining/'`, Plugins `preact()` und `VitePWA({ registerType: 'autoUpdate', workbox: { globPatterns: ['**/*.{js,css,html,png,svg,wasm,task}'], maximumFileSizeToCacheInBytes: 20_000_000 }, manifest: { name: 'Sehtraining', short_name: 'Sehtraining', lang: 'de', display: 'fullscreen', orientation: 'landscape', background_color: '#3c3c3c', theme_color: '#3c3c3c', start_url: '/sehtraining/', scope: '/sehtraining/', icons: [192, 512] } })`.
- `vitest.config.ts`: `environment: 'node'`, `include: ['tests/**/*.test.ts']`; Dateien, die jsdom brauchen, setzen `// @vitest-environment jsdom` selbst.
- `index.html`: `lang="de"`, Viewport `width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no`, `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=black-translucent`, `apple-touch-icon` → `icons/icon-180.png`, `<div id="app">`.
- `src/styles.css`: `html, body { background:#3c3c3c; color:#e0e0e0; margin:0; height:100%; overflow:hidden; touch-action:none; -webkit-user-select:none; font-family: system-ui, sans-serif; }`, Klasse `.screen { transition: opacity 300ms; }`, Basisschrift 48 px für Patientenbildschirme (`.patient`), 20 px für Admin (`.admin`).
- `.gitignore`: `node_modules/`, `dist/`, `dev-dist/`, `*.local`, `exports/`.

- [ ] **Step 3: Icons erzeugen**

`scripts/make-icons.mjs` schreibt PNGs (RGBA, zlib-komprimiert, CRC32 selbst berechnet) der Größen 180, 192, 512: Fläche `#3c3c3c`, mittig ein hellgraues Kreuz (`#e0e0e0`, Balkenbreite 8 % der Kantenlänge), links davon ein weicher heller Punkt. Run: `npm run icons` → drei Dateien in `public/icons/`.

- [ ] **Step 4: Smoke-Test schreiben, `src/main.tsx` minimal**

```ts
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';
describe('smoke', () => { it('läuft', () => { expect(1 + 1).toBe(2); }); });
```
`src/main.tsx` rendert vorerst `<div class="patient screen">Sehtraining</div>` in `#app` und importiert `styles.css`.

- [ ] **Step 5: Verifizieren**

Run: `npm test && npm run typecheck && npm run build`
Expected: Tests PASS, keine TS-Fehler, `dist/` enthält `index.html`, `sw.js`, `manifest.webmanifest`.

- [ ] **Step 6: Pages-Workflow**

`.github/workflows/deploy.yml`: Trigger `push` auf `main` und `workflow_dispatch`; `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages, cancel-in-progress: true`. Job `build`: `actions/checkout@v4`, `actions/setup-node@v4` (node 22, cache npm), `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (path `dist`). Job `deploy` (needs build): `environment: github-pages`, `actions/deploy-pages@v4`.

- [ ] **Step 7: README-Grundgerüst (deutsch)**

Abschnitte: Zweck und Hinweis „kein Medizinprodukt“; Installation auf dem iPad (Safari → Teilen → „Zum Home-Bildschirm“); iPad-Einstellungen (Auto-Helligkeit und True Tone aus, Helligkeit fest, Lautstärke etwa halb, Halterung mit festem Abstand, „Geführter Zugriff“); Entwicklung (`npm install`, `npm run dev`, `npm test`); Datenschutz (Daten nur auf dem iPad, nie Exporte ins Repo). Abschnitte „Tägliche Nutzung“ und „Datenexport“ als Überschrift mit einem Satz Stand M1.

- [ ] **Step 8: Commit und Push**

```bash
git add -A && git commit -m "chore: Projektgerüst mit Vite, Preact, Vitest, PWA und Pages-Workflow" && git push
```

---

### Task 2: Seedbarer Zufall und gemeinsame Typen

**Files:**
- Create: `src/core/rng.ts`, `src/core/types.ts`
- Test: `tests/core/rng.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Rng { next(): number /* [0,1) */; uniform(a: number, b: number): number; int(n: number): number /* 0..n-1 */; shuffle<T>(xs: readonly T[]): T[]; seed(): number }
  export function createRng(seed: number): Rng   // mulberry32
  ```
  `types.ts`:
  ```ts
  export type Side = 'L' | 'R';
  export interface VisualPos { side: Side; eccDeg: number; angleDeg: number } // angleDeg +90 oben, 0 horizontal, -90 unten
  export type TrialKind = 'left' | 'right' | 'catch';
  export type SoundCondition = 'none' | 'sync' | 'lead' | 'wrongSide';
  export type Outcome = 'hit' | 'miss' | 'anticipation' | 'falseAlarm' | 'correctRejection' | 'aborted';
  export interface TrialPlan {
    id: string; sessionId: string; index: number; kind: TrialKind;
    pos: VisualPos | null; gridPointId: string | null; level: number | null;
    sound: SoundCondition; soaMs: number /* Tonbeginn relativ zu t0, negativ = vorher */; soundGainDb: number;
    waitMs: number; rampMs: number; plateauMs: number; responseWindowMs: number; phase: string;
  }
  export interface TrialRecord extends TrialPlan {
    startedAtIso: string; outcome: Outcome; rtMs: number | null;
    contrast: number | null; sigmaDeg: number | null; stimulusPx: { x: number; y: number } | null;
    fixationOk: boolean | null; abortReason: string | null;
  }
  ```

- [ ] **Step 1: Failing tests**

```ts
it('ist deterministisch je Seed', () => { const a = createRng(42), b = createRng(42); expect([a.next(), a.next()]).toEqual([b.next(), b.next()]); });
it('liefert Werte in [0,1)', () => { const r = createRng(1); for (let i = 0; i < 10000; i++) { const v = r.next(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); } });
it('int(n) deckt 0..n-1 ab', () => { const r = createRng(7); const seen = new Set<number>(); for (let i = 0; i < 1000; i++) seen.add(r.int(5)); expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]); });
it('shuffle ist Permutation und verändert Eingabe nicht', () => { const xs = [1, 2, 3, 4, 5]; const s = createRng(3).shuffle(xs); expect([...s].sort()).toEqual(xs); expect(xs).toEqual([1, 2, 3, 4, 5]); });
it('Mittelwert von uniform(1000,2500) nahe 1750', () => { const r = createRng(9); let s = 0; for (let i = 0; i < 20000; i++) s += r.uniform(1000, 2500); expect(s / 20000).toBeGreaterThan(1730); expect(s / 20000).toBeLessThan(1770); });
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run tests/core/rng.test.ts`, „createRng is not a function“ o. ä.)
- [ ] **Step 3: Implementieren** (mulberry32, Fisher-Yates)
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `feat(core): seedbarer Zufall und gemeinsame Typen`

---

### Task 3: Geometrie

**Files:**
- Create: `src/core/geometry.ts`
- Test: `tests/core/geometry.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface GeometryInput { screenWidthCm: number; viewingDistanceCm: number; fixationXFraction: number; fixationYFraction: number }
  export interface Geometry extends GeometryInput { viewportWidthPx: number; viewportHeightPx: number; pxPerCm: number; fixPx: { x: number; y: number } }
  export function makeGeometry(input: GeometryInput, viewportWidthPx: number, viewportHeightPx: number): Geometry
  export function visualToPx(g: Geometry, p: VisualPos): { x: number; y: number }
  export function pxToVisual(g: Geometry, x: number, y: number): VisualPos
  export function sigmaDegToPx(g: Geometry, eccDeg: number, sigmaDeg: number): number
  export function fitsOnScreen(g: Geometry, p: VisualPos, marginDeg: number): boolean
  export function maxEccentricityDeg(g: Geometry, side: Side, angleDeg: number): number
  export function angularDistanceDeg(a: VisualPos, b: VisualPos): number
  ```
  Zentralprojektion: Abstand vom Kreuz in cm = d·tan(e); x = fixX + s·d·tan(e)·cos(φ)·pxPerCm mit s = −1 für L, +1 für R; y = fixY − d·tan(e)·sin(φ)·pxPerCm. `sigmaDegToPx` = d·(tan(e+σ) − tan(e))·pxPerCm. `fitsOnScreen`: der Punkt um `marginDeg` exzentrischer liegt noch innerhalb `[0, width] × [0, height]`. `angularDistanceDeg`: Winkel zwischen den Richtungsvektoren (tan-Ebene → Einheitsvektor (x, y, 1)/‖·‖).

- [ ] **Step 1: Failing tests** (Referenz: Breite 24 cm, Viewport 1200×800 → 50 px/cm; d = 30; Kreuz bei 2/3, 1/2 → (800, 400))

```ts
const g = makeGeometry({ screenWidthCm: 24, viewingDistanceCm: 30, fixationXFraction: 2/3, fixationYFraction: 0.5 }, 1200, 800);
const e = Math.atan(10/30) * 180 / Math.PI; // 18.4349°
it('pxPerCm und Kreuz', () => { expect(g.pxPerCm).toBeCloseTo(50); expect(g.fixPx).toEqual({ x: 800, y: 400 }); });
it('links horizontal 10 cm', () => { const p = visualToPx(g, { side: 'L', eccDeg: e, angleDeg: 0 }); expect(p.x).toBeCloseTo(300); expect(p.y).toBeCloseTo(400); });
it('links oben senkrecht', () => { const p = visualToPx(g, { side: 'L', eccDeg: e, angleDeg: 90 }); expect(p.x).toBeCloseTo(800); expect(p.y).toBeCloseTo(-100); });
it('rechts unten 45°', () => { const p = visualToPx(g, { side: 'R', eccDeg: e, angleDeg: -45 }); expect(p.x).toBeCloseTo(800 + 500 * Math.SQRT1_2); expect(p.y).toBeCloseTo(400 + 500 * Math.SQRT1_2); });
it('Hin- und Rückrechnung', () => { for (const pos of [{ side: 'L', eccDeg: 3, angleDeg: 75 }, { side: 'L', eccDeg: 23, angleDeg: -30 }, { side: 'R', eccDeg: 8, angleDeg: 0 }] as const) { const v = pxToVisual(g, ...Object.values(visualToPx(g, pos)) as [number, number]); expect(v.side).toBe(pos.side); expect(v.eccDeg).toBeCloseTo(pos.eccDeg, 6); expect(v.angleDeg).toBeCloseTo(pos.angleDeg, 6); } });
it('fitsOnScreen', () => { expect(fitsOnScreen(g, { side: 'L', eccDeg: e, angleDeg: 0 }, 1)).toBe(true); expect(fitsOnScreen(g, { side: 'L', eccDeg: 45, angleDeg: 0 }, 1)).toBe(false); expect(fitsOnScreen(g, { side: 'L', eccDeg: e, angleDeg: 90 }, 1)).toBe(false); });
it('maxEccentricity links horizontal = atan(16/30)', () => { expect(maxEccentricityDeg(g, 'L', 0)).toBeCloseTo(Math.atan(16/30) * 180 / Math.PI, 3); });
it('sigma wächst mit Exzentrizität', () => { expect(sigmaDegToPx(g, 20, 1)).toBeGreaterThan(sigmaDegToPx(g, 0, 1)); expect(sigmaDegToPx(g, 0, 1)).toBeCloseTo(30 * Math.tan(Math.PI/180) * 50, 6); });
it('Winkelabstand über die Mittellinie', () => { expect(angularDistanceDeg({ side: 'L', eccDeg: 3, angleDeg: 0 }, { side: 'R', eccDeg: 3, angleDeg: 0 })).toBeCloseTo(6, 6); });
```

- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `feat(core): Geometrie Grad ↔ Pixel`

---

### Task 4: Reizstufen, Hüllkurve, Blob-Patch

**Files:**
- Create: `src/core/stimulus.ts`
- Test: `tests/core/stimulus.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const LEVEL_COUNT = 12; export const REFERENCE_LEVEL = 6;
  export const CONTRAST_MIN = 0.05; export const CONTRAST_CAP = 4.0; export const SIGMA_BASE_DEG = 0.5; export const SIGMA_MAX_DEG = 1.5;
  export const BG_SRGB = 0x3c; export const RAMP_MS = 150; export const PLATEAU_MS = 300;
  export function levelParams(level: number): { contrast: number; sigmaDeg: number }
  export function envelope(tMs: number, rampMs: number, plateauMs: number): number   // 0..1, Cosinus-Rampen, 0 außerhalb
  export function srgbToLinear(v8: number): number; export function linearToSrgb(l: number): number
  export function renderBlobPatch(sigmaPx: number, contrast: number, gain: number): { size: number; rgba: Uint8ClampedArray }
  ```
  Stufen 0–8: Kontrast = 0,05·(4,0/0,05)^(L/8), σ = 0,5°. Stufen 9–11: Kontrast = 4,0, σ = 0,5·3^((L−8)/3) (→ 0,72; 1,04; 1,5). `renderBlobPatch`: quadratisch, Kantenlänge `2·ceil(3σ)+1`, Pixel = linearToSrgb(L_bg·(1 + contrast·gain·exp(−r²/2σ²))), Alpha 255; Rand = exakt Hintergrund.

- [ ] **Step 1: Failing tests**

```ts
it('Stufe 0 und 8', () => { expect(levelParams(0)).toEqual({ contrast: 0.05, sigmaDeg: 0.5 }); expect(levelParams(8).contrast).toBeCloseTo(4.0); });
it('Stufe 11 = Deckel', () => { const p = levelParams(11); expect(p.contrast).toBeCloseTo(4.0); expect(p.sigmaDeg).toBeCloseTo(1.5); });
it('Stufen monoton', () => { for (let l = 1; l < 12; l++) { const a = levelParams(l - 1), b = levelParams(l); expect(b.contrast * b.sigmaDeg ** 2).toBeGreaterThan(a.contrast * a.sigmaDeg ** 2); } });
it('wirft außerhalb 0..11', () => { expect(() => levelParams(12)).toThrow(); expect(() => levelParams(-1)).toThrow(); });
it('Hüllkurve', () => { expect(envelope(-1, 150, 300)).toBe(0); expect(envelope(0, 150, 300)).toBe(0); expect(envelope(75, 150, 300)).toBeCloseTo(0.5); expect(envelope(150, 150, 300)).toBe(1); expect(envelope(449, 150, 300)).toBe(1); expect(envelope(525, 150, 300)).toBeCloseTo(0.5); expect(envelope(600, 150, 300)).toBe(0); });
it('sRGB hin und zurück', () => { for (const v of [0, 60, 128, 255]) expect(Math.round(linearToSrgb(srgbToLinear(v)))).toBe(v); });
it('Patch: Mitte heller, Rand = Hintergrund, nie weiß', () => { const { size, rgba } = renderBlobPatch(10, 4.0, 1); const c = ((size >> 1) * size + (size >> 1)) * 4; expect(rgba[c]).toBeGreaterThan(0x3c); expect(rgba[c]).toBeLessThan(255); expect(rgba[0]).toBe(0x3c); });
it('Patch bei gain 0 ist reiner Hintergrund', () => { const { rgba } = renderBlobPatch(5, 4.0, 0); for (let i = 0; i < rgba.length; i += 4) expect(rgba[i]).toBe(0x3c); });
```

- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `feat(core): Reizstufen, Hüllkurve und Blob-Darstellung`

---

### Task 5: Sicherheitsprüfung

**Files:**
- Create: `src/core/safety.ts`
- Test: `tests/core/safety.test.ts`

**Interfaces:**
- Consumes: `TrialPlan` (Task 2), `levelParams`, `CONTRAST_CAP`, `SIGMA_MAX_DEG` (Task 4)
- Produces:
  ```ts
  export const SAFETY = { minRampMs: 100, stimulusDurationMs: 600, minGapMs: 1000, maxSoundGainDb: 0 } as const;
  export function stimulusInterval(plan: TrialPlan): { startMs: number; endMs: number } | null // relativ zu t0; Licht [0, 2·ramp+plateau], Ton [soa, soa+2·ramp+plateau]; null bei catch ohne Ton
  export function checkTrialPlan(plan: TrialPlan): string[]             // leere Liste = ok; deutsche Meldungen
  export function checkGap(prevEndAbsMs: number | null, nextStartAbsMs: number): string[]
  ```
  `checkTrialPlan` prüft: `rampMs >= 100`; Level in 0..11 bzw. null bei catch; `levelParams(level).contrast <= CONTRAST_CAP` und `sigmaDeg <= SIGMA_MAX_DEG`; `soundGainDb <= 0`; `pos !== null` genau dann, wenn `kind !== 'catch'`; `waitMs >= 0`.

- [ ] **Step 1: Failing tests** — gültiger Plan → `[]`; je ein Test pro Regel mit genau einem Verstoß (Rampe 99, Level 12, Gain +1 dB, catch mit pos); `checkGap(1000, 1999)` → 1 Meldung, `checkGap(1000, 2000)` → `[]`, `checkGap(null, 0)` → `[]`; `stimulusInterval` für soa −200 → `{startMs: -200, endMs: 600}`.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `feat(core): Sicherheitsprüfung für Reizpläne`

---

### Task 6: Antwortklassifikation, Antwortfenster, Blockmischung und M1-Planer

**Files:**
- Create: `src/core/trial.ts`, `src/core/blocks.ts`
- Test: `tests/core/trial.test.ts`, `tests/core/blocks.test.ts`

**Interfaces:**
- Consumes: `Rng`, Typen, `Geometry`/`fitsOnScreen`, `checkTrialPlan`, `checkGap`, `stimulusInterval`, Konstanten aus Task 4/5
- Produces:
  ```ts
  // trial.ts
  export const MIN_RT_MS = 150; export const DEFAULT_WINDOW_MS = 2000;
  export function classifyResponse(kind: TrialKind, rtMs: number | null, windowMs: number): Outcome // rtMs relativ zu t0
  export function responseWindowFromReference(rtsMs: readonly number[]): number // Median + 3·MAD, auf 1500..3000 begrenzt; < 5 Werte → DEFAULT_WINDOW_MS
  // blocks.ts
  export const BLOCK_SIZE = 20; export const BLOCK_COUNTS = { left: 14, right: 4, catch: 2 } as const;
  export function makeBlock(rng: Rng): TrialKind[]
  export interface BasicPlannerOptions { sessionId: string; geometry: Geometry; responseWindowMs: number; onlyKind?: TrialKind }
  export function createBasicPlanner(rng: Rng, opts: BasicPlannerOptions): { next(): TrialPlan }
  ```
  `createBasicPlanner`: zieht Blöcke nacheinander; Orte für links/rechts gleichverteilt über das Raster e ∈ {3, 8, 13, …}, φ ∈ {−90, −75, …, 90}, nur Punkte mit `fitsOnScreen(g, p, 1)`; Verschiebung ±1° in e und ±(1°/max(e,1)) rad in φ; `level = REFERENCE_LEVEL`, `sound = 'sync'` (bei catch `'none'`), `soaMs = 0`, `soundGainDb = 0`, `waitMs = rng.uniform(1000, 2500)`, `rampMs = 150`, `plateauMs = 300`, `phase = '1'`, `gridPointId = 'L-e8-a-30'`-Format. Jeder Plan durchläuft `checkTrialPlan`; bei Verstoß wird geworfen (in M1 ein Programmierfehler). `id` = `${sessionId}-${index}`.

- [ ] **Step 1: Failing tests (trial)**

```ts
it.each([
  ['left', 149, 'anticipation'], ['left', 150, 'hit'], ['left', 2000, 'hit'], ['left', 2001, 'miss'], ['left', null, 'miss'],
  ['catch', 500, 'falseAlarm'], ['catch', null, 'correctRejection'], ['catch', 100, 'falseAlarm'],
])('%s rt=%s → %s', (k, rt, o) => expect(classifyResponse(k as TrialKind, rt as number | null, 2000)).toBe(o));
it('Fenster aus Referenz', () => { expect(responseWindowFromReference([500, 520, 540, 560, 580])).toBe(1500); expect(responseWindowFromReference([1500, 1600, 1700, 1800, 1900])).toBe(2000); expect(responseWindowFromReference([1000, 1400, 1800, 2200, 2600])).toBe(3000); expect(responseWindowFromReference([600])).toBe(2000); });
```
(Fälle: Median 540 + 3·20 = 600 → 1500 (Untergrenze); 1700 + 3·100 = 2000; 1800 + 3·400 = 3000 (Obergrenze); weniger als 5 Werte → 2000.)

- [ ] **Step 2: Failing tests (blocks)**

```ts
it('Block hat 14/4/2', () => { const b = makeBlock(createRng(1)); expect(b.filter(k => k === 'left')).toHaveLength(14); expect(b.filter(k => k === 'right')).toHaveLength(4); expect(b.filter(k => k === 'catch')).toHaveLength(2); });
// describe-Ebene: g wie in Task 3; const ps = (() => { const pl = createBasicPlanner(createRng(5), { sessionId: 's', geometry: g, responseWindowMs: 2000 }); return Array.from({ length: 2000 }, () => pl.next()); })();
it('Planer: 2000 Pläne gültig, Anteile exakt je 20, alle Orte auf dem Bildschirm', () => { expect(ps.filter(p => p.kind === 'left')).toHaveLength(1400); for (const p of ps) { expect(checkTrialPlan(p)).toEqual([]); if (p.pos) expect(fitsOnScreen(g, p.pos, 0)).toBe(true); expect(p.waitMs).toBeGreaterThanOrEqual(1000); expect(p.waitMs).toBeLessThanOrEqual(2500); } });
it('Planer: linke Orte links, rechte rechts', () => { for (const p of ps) { if (p.kind === 'left') expect(p.pos!.side).toBe('L'); if (p.kind === 'right') expect(p.pos!.side).toBe('R'); if (p.kind === 'catch') expect(p.pos).toBeNull(); } });
it('Planer: onlyKind right liefert nur rechte Pläne', () => { const pl = createBasicPlanner(createRng(6), { sessionId: 's', geometry: g, responseWindowMs: 2000, onlyKind: 'right' }); for (let i = 0; i < 100; i++) expect(pl.next().kind).toBe('right'); });
it('Planer: Abstand zwischen Reizen ≥ 1000 ms bei schnellster Taktung', () => { // schnellste Taktung: Durchgang endet bei t0 + 600 (sofortige Antwort), nächster t0 = Ende + waitMs
  let end: number | null = null, t = 0; for (const p of ps) { const iv = stimulusInterval(p); const t0 = t + p.waitMs; if (iv) { expect(checkGap(end, t0 + iv.startMs)).toEqual([]); end = t0 + iv.endMs; } t = t0 + 600; } });
```

- [ ] **Step 3: Run → FAIL**
- [ ] **Step 4: Implementieren**
- [ ] **Step 5: Run → PASS**
- [ ] **Step 6: Commit** `feat(core): Antwortklassifikation, Blockmischung und Grundplaner`

---

### Task 7: Audio

**Files:**
- Create: `src/io/spatial.ts`, `src/io/audio.ts`
- Test: `tests/io/spatial.test.ts`, `tests/io/audio.test.ts`

**Interfaces:**
- Consumes: `VisualPos`, `envelope`
- Produces:
  ```ts
  // spatial.ts (rein)
  export function visualToAzEl(p: VisualPos): { azimuthDeg: number; elevationDeg: number } // Richtungsvektor (s·tan e·cos φ, tan e·sin φ, 1); az = atan2(x, 1), el = atan2(y, √(1+x²)); links negativ
  export function stereoPan(azimuthDeg: number): number   // sin(az), auf [-1, 1]
  export function dbToGain(db: number): number
  export function mirrorToRight(p: VisualPos): VisualPos   // für M2 (Falsch-Ton), schon hier testen
  // audio.ts
  export type OutputMode = 'headphones' | 'speakers';
  export const MASTER_GAIN_CAP = 0.5;   // linear, vor Limiter
  export interface AudioSettings { outputMode: OutputMode; volume: number /* 0..1 Anteil vom Deckel */; balance: number /* -1..1 */ }
  export class AudioEngine {
    constructor(ctxFactory?: () => AudioContext);
    ensureRunning(): Promise<void>;                 // erzeugt Kontext beim ersten Aufruf, resume() bei 'suspended' | 'interrupted'
    apply(settings: AudioSettings): void;           // volume wird auf [0, 1] geklemmt; Master = MASTER_GAIN_CAP · volume
    nowSec(): number;
    scheduleBurst(opts: { pos: VisualPos; gainDb: number; atSec: number; rampMs: number; plateauMs: number }): void; // rosa Rauschen, Hüllkurve per setValueCurveAtTime aus envelope()
    playChime(): void;                              // 660 Hz + 990 Hz Sinus, 20 ms Anstieg, 400 ms Abklingen, −20 dB
    testSide(side: Side): void;                     // für Einrichtung: Burst bei e = 30°, φ = 0
  }
  export function initialVolume(saved: number | null): number // min(saved ?? 0.5, 0.5)
  ```
  Signalweg: Quelle → Hüllkurven-Gain → (`PannerNode` HRTF, `positionX/Y/Z` aus Azimut/Elevation auf Einheitskugel) oder (`StereoPannerNode` mit `stereoPan + balance` geklemmt) → Master-Gain → `DynamicsCompressorNode` (threshold −12 dB, ratio 12) → destination. Rosa Rauschen: 2 s Puffer einmal erzeugen (Voss-McCartney oder Paul-Kellet-Filter), pro Burst zufälliger Startoffset.

- [ ] **Step 1: Failing tests (spatial)** — `visualToAzEl({side:'L', eccDeg:30, angleDeg:0})` → az ≈ −30, el ≈ 0; `angleDeg: 90` → az ≈ 0, el ≈ 30; `stereoPan(-90) = -1`, `stereoPan(0) = 0`; `dbToGain(-6)` ≈ 0,501; `mirrorToRight` spiegelt nur `side`.
- [ ] **Step 2: Failing tests (audio)** — mit Fake-Kontext (Objekt mit `state`, `resume` als `vi.fn` und Stub-Knoten): `ensureRunning` ruft `resume` bei `state = 'interrupted'` und bei `'suspended'`, nicht bei `'running'`; Kontext wird nur einmal erzeugt; `apply({volume: 2})` setzt Master auf `MASTER_GAIN_CAP`; `initialVolume(0.9) === 0.5`, `initialVolume(null) === 0.5`, `initialVolume(0.3) === 0.3`.
- [ ] **Step 3: Run → FAIL**
- [ ] **Step 4: Implementieren**
- [ ] **Step 5: Run → PASS**
- [ ] **Step 6: Commit** `feat(io): räumliches Audio mit Deckel und Limiter`

---

### Task 8: Eingabe

**Files:**
- Create: `src/io/input.ts`
- Test: `tests/io/input.test.ts` (`// @vitest-environment jsdom`)

**Interfaces:**
- Produces:
  ```ts
  export interface ResponseEvent { timeMs: number /* event.timeStamp, gleiche Achse wie performance.now() */; source: 'pointer' | 'key' }
  export class ResponseInput {
    constructor(target: EventTarget);
    arm(onResponse: (e: ResponseEvent) => void): void; // genau eine Meldung bis zum nächsten arm()
    disarm(): void;
    dispose(): void;
  }
  ```
  Lauscht auf `pointerdown` und `keydown` (`{ capture: true }`); `keydown` mit `repeat === true` wird ignoriert; ruft bei `pointerdown` `preventDefault()` (unterdrückt Kompatibilitäts-Mausereignisse und Zoom); nach der ersten Meldung bis zum nächsten `arm` stumm; ohne `arm` stumm.

- [ ] **Step 1: Failing tests** — ohne `arm` kein Aufruf; nach `arm` ein `pointerdown` → 1 Aufruf mit `source 'pointer'` und `timeMs === event.timeStamp`; `pointerdown` gefolgt von `mousedown` und zweitem `pointerdown` → weiterhin 1 Aufruf; `keydown` mit `repeat: true` → 0 Aufrufe; `disarm` nach `arm` → 0 Aufrufe; `dispose` entfernt Listener.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `feat(io): Antworteingabe per Tippen und Taste`

---

### Task 9: Speicherung, Export, Import

**Files:**
- Create: `src/store/db.ts`, `src/store/exportData.ts`
- Test: `tests/store/db.test.ts`, `tests/store/exportData.test.ts` (beide `import 'fake-indexeddb/auto'`)

**Interfaces:**
- Consumes: `TrialRecord`, `GeometryInput`, `AudioSettings`
- Produces:
  ```ts
  // db.ts
  export const DB_NAME = 'sehtraining'; export const DB_VERSION = 1;
  export interface Settings { disclaimerAcceptedAt: string | null; geometry: GeometryInput | null; audio: AudioSettings; referenceRtsMs: number[]; responseWindowMs: number | null }
  export const DEFAULT_SETTINGS: Settings // audio { outputMode: 'headphones', volume: 0.5, balance: 0 }, geometry null, fixation 2/3 / 0,5 bei Neuanlage im Assistenten
  export interface SessionRecord { id: string; startedAtIso: string; endedAtIso: string | null; dayKey: string /* YYYY-MM-DD lokal */; kind: 'training' | 'reference'; trialCount: number }
  export type Db = { getSettings(): Promise<Settings>; saveSettings(s: Settings): Promise<void>; addSession(s: SessionRecord): Promise<void>; updateSession(s: SessionRecord): Promise<void>; listSessions(): Promise<SessionRecord[]>; addTrial(t: TrialRecord): Promise<void>; listTrials(sessionId?: string): Promise<TrialRecord[]>; clearAll(): Promise<void> };
  export function openDb(name?: string): Promise<Db>
  // exportData.ts
  export const EXPORT_SCHEMA = 'sehtraining-export/1';
  export interface ExportBundle { schema: typeof EXPORT_SCHEMA; exportedAtIso: string; settings: Settings; sessions: SessionRecord[]; trials: TrialRecord[] }
  export function exportAll(db: Db, nowIso: string): Promise<ExportBundle>
  export function importAll(db: Db, bundle: unknown): Promise<{ sessions: number; trials: number }> // prüft schema, ersetzt alles; wirft bei falschem Schema mit deutscher Meldung
  export function trialsToCsv(trials: TrialRecord[]): string
  export async function shareOrDownload(filename: string, mime: string, content: string): Promise<void> // navigator.share({files}) wenn canShare, sonst <a download>
  ```
  Stores: `settings` (Schlüssel `'main'`), `sessions` (keyPath `id`, Index `dayKey`), `trials` (keyPath `id`, Index `sessionId`). CSV: Semikolon als Trenner, Dezimalpunkt, UTF-8 mit BOM, Spalten in fester Reihenfolge: `id;sessionId;index;startedAtIso;kind;side;eccDeg;angleDeg;gridPointId;level;contrast;sigmaDeg;sound;soaMs;soundGainDb;waitMs;responseWindowMs;phase;outcome;rtMs;fixationOk;abortReason`; leere Felder für null; Felder mit `;` oder `"` werden in `"` gesetzt und `"` verdoppelt.

- [ ] **Step 1: Failing tests (db)** — `getSettings` auf leerer DB liefert `DEFAULT_SETTINGS`; speichern/lesen rund; zwei Sitzungen, drei Trials, `listTrials('s1')` filtert; `clearAll` leert.
- [ ] **Step 2: Failing tests (export)** — `exportAll` → `importAll` in frische DB → gleiche Sitzungen und Trials (tiefer Vergleich); `importAll({schema: 'x'})` wirft `/Format/`; CSV: Kopfzeile exakt wie oben, beginnt mit `﻿`, ein Trial mit `abortReason: 'a;b"c'` ergibt `"a;b""c"`, null-Felder leer.
- [ ] **Step 3: Run → FAIL**
- [ ] **Step 4: Implementieren** (mit `idb`)
- [ ] **Step 5: Run → PASS**
- [ ] **Step 6: Commit** `feat(store): IndexedDB, Export als JSON/CSV und Import`

---

### Task 10: Durchgangs-Runner und Reizdarstellung

**Files:**
- Create: `src/ui/runner.ts`, `src/ui/StimulusCanvas.ts`
- Test: `tests/ui/runner.test.ts`

**Interfaces:**
- Consumes: `TrialPlan`, `TrialRecord`, `classifyResponse`, `envelope`, `levelParams`, `renderBlobPatch`, `visualToPx`, `sigmaDegToPx`, `AudioEngine`, `ResponseInput`, `ResponseEvent`
- Produces:
  ```ts
  export interface RunnerDeps {
    now(): number;                                     // performance.now
    frame(cb: (t: number) => void): void;              // requestAnimationFrame
    draw(state: { fixation: boolean; blob: { x: number; y: number; sigmaPx: number; contrast: number; gain: number } | null }): void;
    scheduleSound(plan: TrialPlan, t0Ms: number): void; // rechnet t0 in AudioContext-Zeit um: ctx.currentTime + (t0Ms + soaMs - now()) / 1000
    input: { arm(cb: (e: ResponseEvent) => void): void; disarm(): void };
    geometry(): Geometry;
    signals: { onAbort(cb: (reason: 'hidden' | 'resize') => void): () => void };
  }
  export function runTrial(plan: TrialPlan, deps: RunnerDeps, startedAtIso: string): Promise<TrialRecord>
  export function createCanvasDraw(canvas: HTMLCanvasElement, getGeometry: () => Geometry): RunnerDeps['draw'] // StimulusCanvas.ts
  ```
  Ablauf in `runTrial`: Kreuz zeichnen → nach `waitMs` ist t0 → `scheduleSound` (falls `sound !== 'none'`) → pro Frame `gain = envelope(t − t0, rampMs, plateauMs)`; Eingabe wird ab Kreuz-Anzeige scharf geschaltet (frühe Antworten vor t0 ergeben `rtMs < 0` → `anticipation` bzw. bei catch `falseAlarm`); Ende bei `max(t0 + responseWindowMs, t0 + 600)` oder sofort nach Antwort, sobald der Reiz vollständig ausgeblendet ist; Rückgabe mit `classifyResponse`. Abbruchsignal → `outcome 'aborted'`, `abortReason` gesetzt, Reiz sofort auf gain 0. `createCanvasDraw`: Canvas in Gerätepixeln (`devicePixelRatio`), Hintergrund `#3c3c3c` vollflächig, Kreuz 1° (Arme 0,5°, Strichstärke 0,1°, `#e0e0e0`), Blob per `putImageData` aus `renderBlobPatch` an Gerätepixelposition; Patch-Cache je (σ, contrast), nur `gain` ändert sich pro Frame → Patch neu rendern ist erlaubt (klein).

- [ ] **Step 1: Failing tests** mit Fake-Uhr (`now` gibt Variable zurück) und Fake-`frame` (führt Callbacks bei manuellem `tick(ms)` aus):
  - Antwort 400 ms nach t0 → `hit`, `rtMs = 400`; `scheduleSound` einmal mit diesem Plan aufgerufen.
  - keine Antwort → `miss`, Promise löst bei t0 + Fenster auf.
  - Antwort 100 ms vor t0 → `anticipation`, `rtMs = -100`.
  - catch-Plan, keine Antwort → `correctRejection`, `draw` nie mit `blob !== null`.
  - Abbruch `'hidden'` bei t0 + 100 → `aborted`, `abortReason 'hidden'`, letzter `draw` hat `blob === null`.
  - Abbruch `'resize'` → `aborted`, `abortReason 'resize'`.
  - `gain` im gezeichneten Blob ist bei t0 + 75 ≈ 0,5 und bei t0 + 300 = 1.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: Run → PASS**
- [ ] **Step 5: Commit** `feat(ui): Durchgangs-Runner und Canvas-Darstellung`

---

### Task 11: Einrichtungsassistent

**Files:**
- Create: `src/ui/validate.ts`, `src/ui/setup/SetupWizard.tsx`, `src/ui/setup/steps/{Disclaimer,GeometryStep,AudioStep,ReferenceStep}.tsx`
- Test: `tests/ui/validate.test.ts`

**Interfaces:**
- Consumes: `Db`, `Settings`, `AudioEngine`, `runTrial`, `createBasicPlanner` mit `onlyKind: 'right'`, `responseWindowFromReference`, `makeGeometry`, `maxEccentricityDeg`
- Produces:
  ```ts
  export function parseCm(input: string): { ok: true; value: number } | { ok: false; message: string } // akzeptiert "24,5" und "24.5"; 10 ≤ x ≤ 200, sonst "Bitte einen Wert zwischen 10 und 200 cm eingeben."
  export function SetupWizard(props: { db: Db; audio: AudioEngine; onDone(): void }): JSX.Element
  ```
  Schritte (Admin-Stil, 20 px, alles bedienbar mit Touch):
  1. Hinweis: Text „Diese App ist kein Medizinprodukt und stellt keine Diagnosen. Sie ergänzt ein ärztlich begleitetes Training und ersetzt es nicht.“ + Knopf „Verstanden“ → `disclaimerAcceptedAt`.
  2. Geometrie: Felder Breite (cm, mit Hinweis „sichtbare Bildbreite mit Lineal messen“), Abstand (cm, Standard 30), Kreuzposition (Schieber 0,5–0,8, Standard 0,667); Vorschau: max. Exzentrizität links horizontal und Anzahl Rasterpunkte.
  3. Audio: Auswahl Kopfhörer/Lautsprecher, Knöpfe „Links testen“ / „Rechts testen“, Schieber Lautstärke (0–1, Start `initialVolume`) und Balance; Hinweis „iPad-Lautstärke etwa auf die Hälfte stellen.“
  4. Reaktionszeit: Ansagetext auf dem Bildschirm „Schau auf das Kreuz und tippe, sobald rechts ein Licht erscheint.“, 20 rechte Durchgänge (Sitzung `kind: 'reference'`, Trials gespeichert), danach `referenceRtsMs` (nur `hit`) und `responseWindowMs` speichern und anzeigen.
- [ ] **Step 1: Failing tests** — `parseCm('24,5')` → 24,5; `'24.5'` → 24,5; `' 30 '` → 30; `'5'`, `'0'`, `'abc'`, `''`, `'250'` → `ok: false` mit obiger Meldung.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren** (`validate.ts`, dann Assistent)
- [ ] **Step 4: Run → PASS; `npm run typecheck` sauber**
- [ ] **Step 5: Commit** `feat(ui): Einrichtungsassistent mit Geometrie, Audio und Reaktionszeit`

---

### Task 12: App-Gerüst, Training (ein Block), Export- und Testseite

**Files:**
- Create: `src/ui/App.tsx`, `src/ui/patient/StartScreen.tsx`, `src/ui/patient/TrainingScreen.tsx`, `src/ui/admin/ExportPage.tsx`, `src/ui/admin/TestPage.tsx`, `src/ui/session.ts`
- Modify: `src/main.tsx`
- Test: `tests/ui/session.test.ts`

**Interfaces:**
- Consumes: alles Vorherige
- Produces:
  ```ts
  // session.ts
  export function dayKey(d: Date): string                 // lokales YYYY-MM-DD
  export function runBlock(args: { db: Db; planner: { next(): TrialPlan }; deps: RunnerDeps; sessionId: string; trials: number; nowIso(): string; onTrial?(r: TrialRecord): void }): Promise<TrialRecord[]> // speichert jeden Trial sofort; bricht bei 'aborted' ab und gibt bisherige zurück
  ```
  Routing per Hash: `#/` Start (wenn Hinweis fehlt oder Geometrie fehlt → `#/setup`), `#/setup`, `#/train`, `#/export`, `#/test`. In M1 sind `#/export` und `#/test` noch ohne PIN erreichbar (PIN kommt in M3) – nur per URL, nicht verlinkt im Patientenbildschirm.
  - Start: großer runder Knopf „Start“ (mind. 30 % der Höhe) rechts von der Mitte; Tippen irgendwo startet; ruft `audio.ensureRunning()` und `navigator.wakeLock?.request('screen')` (Fehler ignorieren).
  - Training: Vollbild-Canvas, `runBlock` mit 20 Durchgängen (Grundplaner), Treffer → `audio.playChime()`; danach „Heute X von Y gefunden.“ (X = Treffer links, Y = linke Durchgänge) groß und zurück zum Start per Tippen. `visibilitychange`/`resize` → Abbruchsignal; nach Abbruch Text „Pause. Tippe zum Weitermachen.“ bzw. bei Hochformat „Bitte das iPad quer halten.“
  - Export: Knöpfe „Alles sichern (JSON)“, „Durchgänge als Tabelle (CSV)“, „Sicherung einspielen“ (Datei wählen → Vorschau „X Sitzungen, Y Durchgänge – vorhandene Daten werden ersetzt“ → Bestätigen). Dateinamen `sehtraining-YYYY-MM-DD.json/.csv`.
  - Testseite: Auswahl Stufe 0–11, Seite, e, φ, Ton (keiner/gleichzeitig) → „Reiz zeigen“ nutzt `runTrial` mit einem handgebauten Plan; Anzeige des Ergebnisses.
- [ ] **Step 1: Failing tests (session)** — `dayKey(new Date(2026, 9, 11, 23, 59))` → `'2026-10-11'`; `runBlock` mit Fake-Deps, die jede Antwort als Treffer bei 400 ms liefern: 20 Records, alle in der DB; Fake-Deps mit Abbruch im 3. Durchgang → 3 Records, letzter `aborted`.
- [ ] **Step 2: Run → FAIL**
- [ ] **Step 3: Implementieren**
- [ ] **Step 4: Run → PASS; `npm run typecheck && npm run build` sauber**
- [ ] **Step 5: Manuelle Prüfung im Browser** — `npm run build && npx vite preview --host`, mit Playwright (Chromium, Viewport 1180×820, `hasTouch`) Ablauf: Einrichtung ausfüllen → Start → 20 Durchgänge mit automatischen Taps → Ergebnistext erscheint → Export-JSON enthält 20 Trials. Screenshots in `.work/` (nicht committen). Zusätzlich prüfen: kein Netzwerkzugriff außer auf den Preview-Host (Playwright `page.on('request')`).
- [ ] **Step 6: README ergänzen** — „Einrichtung“ (Schritte des Assistenten), „Datenexport“ (Export-Seite `#/export`, Teilen-Menü, Hinweis „Daten weg, wenn App gelöscht“), Stand M1 klar benennen.
- [ ] **Step 7: Commit und Push** `feat(ui): Startbildschirm, Trainingsblock, Export- und Testseite`
- [ ] **Step 8: Deploy prüfen** — GitHub Actions Lauf grün (MCP `actions_list`), Seite `https://aporia-evo.github.io/sehtraining/` liefert 200 und `manifest.webmanifest`.
