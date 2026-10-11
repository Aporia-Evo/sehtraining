/** Gemeinsame Typen des Trainingsprotokolls. */

export type Side = 'L' | 'R';

/** Ort im Gesichtsfeld. angleDeg: +90 oben, 0 horizontal (zur jeweiligen Seite), -90 unten. */
export interface VisualPos {
  side: Side;
  eccDeg: number;
  angleDeg: number;
}

export type TrialKind = 'left' | 'right' | 'catch';

export type SoundCondition = 'none' | 'sync' | 'lead' | 'wrongSide';

export type Outcome = 'hit' | 'miss' | 'anticipation' | 'falseAlarm' | 'correctRejection' | 'aborted';

export interface TrialPlan {
  id: string;
  sessionId: string;
  index: number;
  kind: TrialKind;
  /** null bei Durchgängen ohne Reiz. */
  pos: VisualPos | null;
  gridPointId: string | null;
  /** Reizstufe 0..11, null ohne Reiz. */
  level: number | null;
  sound: SoundCondition;
  /** Tonbeginn relativ zu t0 (Beginn der Lichtrampe); negativ = Ton vorher. */
  soaMs: number;
  /** Tonpegel relativ zum eingestellten Pegel, 0 = voll. */
  soundGainDb: number;
  waitMs: number;
  rampMs: number;
  plateauMs: number;
  responseWindowMs: number;
  phase: string;
}

export interface TrialRecord extends TrialPlan {
  startedAtIso: string;
  outcome: Outcome;
  /** Reaktionszeit relativ zu t0 in ms, null ohne Antwort. */
  rtMs: number | null;
  contrast: number | null;
  sigmaDeg: number | null;
  stimulusPx: { x: number; y: number } | null;
  /** Ob der Ton tatsächlich geplant wurde (false bei Tonbedingung 'none' oder stummem Audio). */
  soundPlayed: boolean;
  /** null ohne Kamera. */
  fixationOk: boolean | null;
  abortReason: string | null;
  /** Treppenstufe der Region vor/nach diesem Durchgang; null, wenn der Durchgang die Treppe nicht bewegt hat. */
  stairBefore: number | null;
  stairAfter: number | null;
}
