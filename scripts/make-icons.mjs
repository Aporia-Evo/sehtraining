// Erzeugt die App-Icons als PNG ohne externe Abhängigkeiten.
// Motiv: dunkelgraue Fläche, hellgraues Fixationskreuz, links davon ein weicher Lichtfleck.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

function png(size) {
  const bg = 0x3c;
  const fg = 0xe0;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const c = size / 2;
  const bar = size * 0.08;
  const arm = size * 0.18;
  const blobX = size * 0.27;
  const blobSigma = size * 0.07;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // Filter: none
    for (let x = 0; x < size; x++) {
      let v = bg;
      const inCross =
        (Math.abs(x + 0.5 - c) <= bar / 2 && Math.abs(y + 0.5 - c) <= arm) ||
        (Math.abs(y + 0.5 - c) <= bar / 2 && Math.abs(x + 0.5 - c) <= arm);
      if (inCross) v = fg;
      const dx = x + 0.5 - blobX;
      const dy = y + 0.5 - c;
      const g = Math.exp(-(dx * dx + dy * dy) / (2 * blobSigma * blobSigma));
      v = Math.max(v, Math.round(bg + (fg - bg) * g));
      const i = row + 1 + x * 4;
      raw[i] = v;
      raw[i + 1] = v;
      raw[i + 2] = v;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // Bittiefe
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of [180, 192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), png(size));
  console.log(`icon-${size}.png`);
}
