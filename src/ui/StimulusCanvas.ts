/** Zeichnen von Fixationskreuz und Lichtfleck auf einem Vollbild-Canvas in Gerätepixeln. */
import { sigmaDegToPx, type Geometry } from '../core/geometry';
import { BG_SRGB, linearToSrgb, srgbToLinear } from '../core/stimulus';
import type { DrawState } from './runner';

const BG_CSS = '#3c3c3c';
const FG_CSS = '#e0e0e0';
const LUT_SIZE = 4096;
const BG_LINEAR = srgbToLinear(BG_SRGB);

/**
 * Schneller Weg für das Pixelbild des Lichtflecks: Profil einmal berechnen, pro Frame nur über eine Tabelle
 * linear → sRGB. Gleiches Ergebnis wie renderBlobPatch (±1 Stufe).
 */
export function createBlobRenderer(sigmaPx: number, contrast: number): { size: number; render(gain: number): Uint8ClampedArray } {
  const half = Math.ceil(3 * sigmaPx);
  const size = 2 * half + 1;
  const edge = Math.exp(-(half * half) / (2 * sigmaPx * sigmaPx));
  const profile = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - half;
      const dy = y - half;
      profile[y * size + x] = Math.max(0, (Math.exp(-(dx * dx + dy * dy) / (2 * sigmaPx * sigmaPx)) - edge) / (1 - edge));
    }
  }
  const lut = new Uint8ClampedArray(LUT_SIZE);
  for (let i = 0; i < LUT_SIZE; i++) {
    lut[i] = Math.round(linearToSrgb(BG_LINEAR * (1 + (contrast * i) / (LUT_SIZE - 1))));
  }
  const out = new Uint8ClampedArray(size * size * 4);
  return {
    size,
    render(gain: number): Uint8ClampedArray {
      const k = gain * (LUT_SIZE - 1);
      for (let i = 0; i < profile.length; i++) {
        const v = lut[Math.round(profile[i]! * k)]!;
        const j = i * 4;
        out[j] = v;
        out[j + 1] = v;
        out[j + 2] = v;
        out[j + 3] = 255;
      }
      return out;
    },
  };
}

export function createCanvasDraw(canvas: HTMLCanvasElement, getGeometry: () => Geometry): (state: DrawState) => void {
  const ctx = canvas.getContext('2d', { alpha: false })!;
  let renderer: { key: string; r: ReturnType<typeof createBlobRenderer>; img: ImageData } | null = null;

  return (state) => {
    const g = getGeometry();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(g.viewportWidthPx * dpr);
    const h = Math.round(g.viewportHeightPx * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG_CSS;
    ctx.fillRect(0, 0, w, h);

    if (state.blob) {
      const sigmaDev = state.blob.sigmaPx * dpr;
      const key = `${sigmaDev.toFixed(2)}|${state.blob.contrast}`;
      if (!renderer || renderer.key !== key) {
        const r = createBlobRenderer(sigmaDev, state.blob.contrast);
        renderer = { key, r, img: new ImageData(r.size, r.size) };
      }
      renderer.img.data.set(renderer.r.render(state.blob.gain));
      const half = (renderer.r.size - 1) / 2;
      ctx.putImageData(renderer.img, Math.round(state.blob.x * dpr - half), Math.round(state.blob.y * dpr - half));
    }

    if (state.fixation) {
      // auf ganze Gerätepixel gerundet: scharfes Kreuz ohne Kantenglättung
      const arm = Math.round(sigmaDegToPx(g, 0, 0.5) * dpr);
      const lw = Math.max(2, Math.round(sigmaDegToPx(g, 0, 0.1) * dpr));
      const cx = Math.round(g.fixPx.x * dpr);
      const cy = Math.round(g.fixPx.y * dpr);
      ctx.fillStyle = FG_CSS;
      ctx.fillRect(cx - arm, cy - lw / 2, 2 * arm, lw);
      ctx.fillRect(cx - lw / 2, cy - arm, lw, 2 * arm);
    }
  };
}
