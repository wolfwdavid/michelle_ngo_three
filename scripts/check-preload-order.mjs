#!/usr/bin/env node
/**
 * check-preload-order.mjs — structural proof for quick 260610-vu7 (POL-02).
 *
 * The hero-poster LCP hint is injected in src/app.html BEFORE %sveltekit.head%
 * so it precedes SvelteKit's JS modulepreload <link>s in DOM order. This script
 * reads the built build/index.html and asserts the hero-poster `rel="preload"`
 * physically appears BEFORE the first `rel="modulepreload"` in the <head>.
 *
 * Exit 0 + "OK" when the order holds; exit 1 with a message otherwise.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '..', 'build', 'index.html');

let html;
try {
  html = readFileSync(htmlPath, 'utf8');
} catch {
  console.error(`check-preload-order: cannot read ${htmlPath} — run \`pnpm build\` first.`);
  process.exit(1);
}

const preloadIdx = html.indexOf('rel="preload"');
const modulepreloadIdx = html.indexOf('rel="modulepreload"');

if (preloadIdx === -1) {
  console.error('check-preload-order: no rel="preload" found in build/index.html — the app.html LCP hint did not emit.');
  process.exit(1);
}

if (modulepreloadIdx !== -1 && preloadIdx > modulepreloadIdx) {
  console.error(
    `check-preload-order: hero-poster rel="preload" (index ${preloadIdx}) appears AFTER the first rel="modulepreload" (index ${modulepreloadIdx}). The app.html hoist did not take effect.`
  );
  process.exit(1);
}

console.log(
  `check-preload-order OK — rel="preload" at index ${preloadIdx} precedes the first rel="modulepreload"` +
    (modulepreloadIdx === -1 ? ' (no modulepreload in this document).' : ` at index ${modulepreloadIdx}.`)
);
