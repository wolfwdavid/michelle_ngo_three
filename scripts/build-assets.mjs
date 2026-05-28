#!/usr/bin/env node
/**
 * Phase 7 (Plan 07-02) — Cinematic-dark static-asset authoring (dev-only, reproducible).
 *
 * Produces _three's OWN cinematic-dark social/favicon art (D-02/D-13) — NOT a
 * reuse of _four's editorial art — via a reproducible sharp composition. The
 * art derives from one of _three's existing reel posters (its own frames), so
 * it satisfies "own art" while keeping the A/B comparison honest through
 * DIMENSIONAL parity with _four (1200x630, comparable filesize — Trap B).
 *
 * Outputs into static/:
 *   - og-image.jpg         (EXACTLY 1200x630 — Trap B parity; comparable ~15KB filesize)
 *   - favicon.ico          (multi-res 16+32 ICO for legacy browser tabs)
 *   - favicon-16.png       (16x16)
 *   - favicon-32.png       (32x32)
 *   - favicon-192.png      (192x192 — Android home-screen / PWA)
 *   - favicon-512.png      (512x512 — Android home-screen / PWA / maskable base)
 *   - apple-touch-icon.png (180x180 — iOS home-screen)
 *   - .nojekyll            (empty — disables GH Pages Jekyll, protects _app/ — Pitfall 5)
 *
 * Design DNA (mirrors src/app.css @theme, converted OKLCH -> sRGB):
 *   - Dark canvas  neutral-950 oklch(0.16 0 0) -> #0d0d0d  (D-02)
 *   - neutral-900  oklch(0.22 0 0)             -> #1b1b1b
 *   - Cream ring   oklch(0.98 0.02 80)         -> #fff7ea  (D-06 warm-white)
 *   - neutral-300  oklch(0.82 0 0)             -> #c4c4c4
 *   - Display font Source Serif 4              -> wordmark (D-09)
 *
 * Reproducible: re-run `node scripts/build-assets.mjs` to regenerate byte-stable
 * output. No new runtime dependency — sharp ships on disk via @sveltejs/enhanced-img.
 *
 * Usage:
 *   node scripts/build-assets.mjs
 */
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const STATIC = join(REPO_ROOT, 'static');
const POSTERS = join(STATIC, 'posters');

// --- Resolve sharp robustly (pnpm-flat store path or hoisted) ---------------
// sharp is a transitive dep of @sveltejs/enhanced-img; under pnpm it lives in
// node_modules/.pnpm/sharp@*/node_modules/sharp and is NOT hoisted to the root.
async function loadSharp() {
  const req = createRequire(import.meta.url);
  const candidates = [
    'sharp', // hoisted (npm / pnpm shamefully-hoist)
  ];
  // Glob the pnpm store for any sharp@* version.
  const pnpmDir = join(REPO_ROOT, 'node_modules', '.pnpm');
  if (existsSync(pnpmDir)) {
    const { readdirSync } = await import('node:fs');
    for (const entry of readdirSync(pnpmDir)) {
      if (/^sharp@/.test(entry)) {
        candidates.push(join(pnpmDir, entry, 'node_modules', 'sharp'));
      }
    }
  }
  for (const c of candidates) {
    try {
      const resolved = req.resolve(c, { paths: [REPO_ROOT] });
      const mod = await import(pathToFileURL(resolved).href);
      return mod.default ?? mod;
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    'Could not resolve sharp. It ships via @sveltejs/enhanced-img — run `pnpm install`.',
  );
}

// --- Palette (sRGB, matched to src/app.css OKLCH @theme) ---------------------
const CANVAS = { r: 13, g: 13, b: 13 }; // neutral-950  oklch(0.16 0 0)
const CANVAS_HEX = '#0d0d0d';
const CREAM = '#fff7ea'; // oklch(0.98 0.02 80)
const NEUTRAL_300 = '#c4c4c4'; // oklch(0.82 0 0)
const NEUTRAL_500 = '#868686'; // oklch(0.62 0 0)
const CAT_REEL = '#9f8cff'; // ~oklch(0.78 0.18 280) — the violet "reel" accent hairline

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Pick a deterministic, landscape-friendly poster as the cinematic backdrop motif. */
function pickBackdropPoster() {
  if (!existsSync(POSTERS)) return null;
  // A wide-ish, dark-toned reel frame; deterministic choice for reproducibility.
  const preferred = ['vimeo-714107646.jpg', 'vimeo-620232398.jpg', 'vimeo-1007061884.jpg'];
  for (const p of preferred) {
    const full = join(POSTERS, p);
    if (existsSync(full)) return full;
  }
  return null;
}

async function buildOgImage(sharp) {
  const W = 1200;
  const H = 630;

  // 1) Cinematic-dark backdrop: a _three reel poster, cover-cropped to 1200x630,
  //    heavily darkened + slightly desaturated + blurred so it reads as a
  //    screening-room motif behind the wordmark (the films "breathe" — PROJECT
  //    core value). This is _three's OWN frame -> satisfies "own art".
  const poster = pickBackdropPoster();
  let backdrop;
  if (poster) {
    backdrop = await sharp(poster)
      .resize(W, H, { fit: 'cover', position: 'attention' })
      .modulate({ brightness: 0.34, saturation: 0.55 }) // darken + desaturate
      .blur(6) // soften so the wordmark dominates
      .toColourspace('srgb')
      .toBuffer();
  } else {
    // Fallback: pure dark canvas if posters are unavailable.
    backdrop = await sharp({
      create: { width: W, height: H, channels: 3, background: CANVAS },
    })
      .png()
      .toBuffer();
  }

  // 2) A dark vignette + bottom gradient SVG overlay so the wordmark always has
  //    contrast against any frame, and the composition reads cinematic-dark.
  const overlay = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vig" cx="50%" cy="46%" r="75%">
      <stop offset="0%" stop-color="${CANVAS_HEX}" stop-opacity="0.30"/>
      <stop offset="62%" stop-color="${CANVAS_HEX}" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="${CANVAS_HEX}" stop-opacity="0.94"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${CANVAS_HEX}" stop-opacity="0"/>
      <stop offset="68%" stop-color="${CANVAS_HEX}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${CANVAS_HEX}" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" fill="url(#floor)"/>
  <!-- D-09 Source Serif 4 wordmark; system serif fallback keeps the build green
       on machines without the font registered with fontconfig. -->
  <text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle"
        font-family="'Source Serif 4', Georgia, 'Times New Roman', serif"
        font-size="118" font-weight="700" letter-spacing="2"
        fill="${CREAM}">${esc('Michelle Ngo')}</text>
  <text x="${W / 2}" y="${H / 2 + 78}" text-anchor="middle"
        font-family="ui-sans-serif, 'Segoe UI', Arial, sans-serif"
        font-size="30" font-weight="500" letter-spacing="9"
        fill="${NEUTRAL_300}">${esc('FILMMAKER & PRODUCER')}</text>
  <!-- reel-accent hairline (violet) — the cinematic flourish that differs from
       _four's editorial card -->
  <rect x="${W / 2 - 70}" y="${H / 2 + 104}" width="140" height="3" rx="1.5" fill="${CAT_REEL}"/>
</svg>`.trim();

  // 3) Composite + encode JPEG. Tune quality so filesize lands in the same band
  //    as _four's ~15KB (Trap B: comparable filesize, within a 3x ratio band).
  let buf;
  for (const q of [82, 74, 66, 58, 50, 44]) {
    buf = await sharp(backdrop)
      .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
      .jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    // _four = 15386 bytes. Within a 3x band => [~5129, ~46158]. Aim mid-band.
    if (buf.length <= 38000) break;
  }

  writeFileSync(join(STATIC, 'og-image.jpg'), buf);

  // Probe to guarantee EXACTLY 1200x630 before returning (Trap B precondition).
  const meta = await sharp(join(STATIC, 'og-image.jpg')).metadata();
  if (meta.width !== W || meta.height !== H) {
    throw new Error(`og-image.jpg is ${meta.width}x${meta.height}, expected ${W}x${H} (Trap B).`);
  }
  return { bytes: buf.length, width: meta.width, height: meta.height };
}

async function buildFavicons(sharp) {
  // 512x512 cinematic-dark favicon master: dark rounded canvas, cream "MN"
  // monogram in Source Serif 4, with a thin reel-accent ring. Distinct from
  // _four's editorial mark; _three's own.
  const S = 512;
  const masterSvg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="#1b1b1b"/>
      <stop offset="100%" stop-color="${CANVAS_HEX}"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${S}" height="${S}" rx="96" fill="url(#g)"/>
  <rect x="34" y="34" width="${S - 68}" height="${S - 68}" rx="72"
        fill="none" stroke="${CAT_REEL}" stroke-opacity="0.55" stroke-width="6"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="central"
        font-family="'Source Serif 4', Georgia, 'Times New Roman', serif"
        font-size="210" font-weight="700" letter-spacing="4"
        fill="${CREAM}">MN</text>
</svg>`.trim();

  const master = await sharp(Buffer.from(masterSvg)).png().toBuffer();

  // PNG favicon sizes.
  const pngSizes = [
    ['favicon-16.png', 16],
    ['favicon-32.png', 32],
    ['favicon-192.png', 192],
    ['favicon-512.png', 512],
    ['apple-touch-icon.png', 180],
  ];
  for (const [name, size] of pngSizes) {
    // apple-touch-icon should be opaque (iOS adds its own rounding/mask) — flatten
    // onto the dark canvas so there is no transparent corner halo on iOS.
    const pipe = sharp(master).resize(size, size, { fit: 'cover' });
    const out =
      name === 'apple-touch-icon.png'
        ? await pipe.flatten({ background: CANVAS }).png().toBuffer()
        : await pipe.png().toBuffer();
    writeFileSync(join(STATIC, name), out);
  }

  // Multi-res .ico (16 + 32). sharp can emit ICO directly; ask for both sizes.
  // sharp >=0.33 supports .ico with multiple resolutions via resize-per-frame is
  // not exposed, so build a 32x32 ICO (browsers downscale to 16). To honor the
  // "multi-res 16+32" intent we assemble a 2-image ICO by hand from the PNGs.
  const ico = buildIco([
    { size: 16, png: readFileSync(join(STATIC, 'favicon-16.png')) },
    { size: 32, png: readFileSync(join(STATIC, 'favicon-32.png')) },
  ]);
  writeFileSync(join(STATIC, 'favicon.ico'), ico);

  return { master: master.length };
}

/**
 * Assemble a multi-resolution ICO file from PNG-encoded entries.
 * ICO format: 6-byte ICONDIR header, then 16-byte ICONDIRENTRY per image,
 * then the raw image payloads (PNG payloads are valid in ICO since Vista).
 */
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // image count

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const payloads = [];
  entries.forEach((e, i) => {
    const base = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, base + 0); // width (0 => 256)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, base + 1); // height
    dir.writeUInt8(0, base + 2); // color palette
    dir.writeUInt8(0, base + 3); // reserved
    dir.writeUInt16LE(1, base + 4); // color planes
    dir.writeUInt16LE(32, base + 6); // bits per pixel
    dir.writeUInt32LE(e.png.length, base + 8); // size of payload
    dir.writeUInt32LE(offset, base + 12); // offset of payload
    offset += e.png.length;
    payloads.push(e.png);
  });

  return Buffer.concat([header, dir, ...payloads]);
}

async function main() {
  const sharp = await loadSharp();
  if (!existsSync(STATIC)) mkdirSync(STATIC, { recursive: true });

  const og = await buildOgImage(sharp);
  console.log(`  og-image.jpg        ${og.width}x${og.height}  ${og.bytes} bytes`);

  await buildFavicons(sharp);
  console.log('  favicon set         favicon.ico (16+32), 16/32/192/512.png, apple-touch (180)');

  // .nojekyll — empty GH Pages Jekyll guard (Pitfall 5; protects _app/ assets).
  writeFileSync(join(STATIC, '.nojekyll'), '');
  console.log('  .nojekyll           written');

  console.log('[build-assets] DONE — cinematic-dark assets written to static/.');
}

main().catch((err) => {
  console.error('[build-assets] FAILED:', err.message);
  process.exit(1);
});
