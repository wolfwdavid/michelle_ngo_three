#!/usr/bin/env node
/**
 * Phase 7 (Plan 07-01) — Build-artifact coverage check.
 *
 * Proves: after `pnpm build`, the static output contains the expected number of
 * prerendered HTML files plus the D-14 70-URL sitemap and the favicon/og-image
 * binaries:
 *   - build/work/index.html                  (1 file — the unfiltered /work route)
 *   - build/work/<slug>/index.html           (8 files — one per category)
 *   - build/watch/<id>/index.html            (56 files — one per video)
 *   - build/pbs-american-portrait/index.html (1 file — PBS landing)
 *   - build/press/index.html                 (1 file — broadcast credits)
 *   - build/about/index.html                 (1 file — /about)
 *   - build/contact/index.html               (1 file — /contact)
 *   - build/sitemap.xml                       (≥70 <url> entries — D-14 pin)
 *   - favicon set + og-image.jpg              (created by Plan 07-02)
 *
 * Why this is necessary in addition to `adapter-static strict: true`:
 *   - `strict: true` fails the build if a route imported by another route is NOT
 *     prerenderable. But if `entries()` returns ZERO entries for /watch/[id],
 *     the build succeeds with zero /watch HTML files — `strict` doesn't catch
 *     an empty enumeration. This script does.
 *
 * Usage:
 *   pnpm build && node scripts/test-prerender-coverage.mjs
 * OR:
 *   pnpm test:prerender (after running `pnpm build` separately)
 *
 * NOTE: the favicon/og-image static-asset assertion will FAIL until Plan 07-02
 * lands those binaries. That is EXPECTED in Wave 1 — the load-bearing proof of
 * this script is the sitemap 70-URL + route-HTML assertions.
 *
 * Exit codes:
 *   0 — all counts meet or exceed the threshold.
 *   1 — at least one count is below threshold (prerender broken).
 *   2 — `build/` directory doesn't exist (run `pnpm build` first).
 */
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const BUILD = resolve(REPO_ROOT, 'build');

if (!existsSync(BUILD)) {
  console.error(
    `[test-prerender-coverage] FATAL: ${BUILD} does not exist. Run 'pnpm build' first.`,
  );
  process.exit(2);
}

/**
 * Count subdirectories inside a directory that themselves contain an index.html
 * file (the canonical adapter-static prerender shape).
 */
function countPrerendered(parentDir) {
  if (!existsSync(parentDir)) return 0;
  const entries = readdirSync(parentDir, { withFileTypes: true });
  let count = 0;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const indexHtml = join(parentDir, e.name, 'index.html');
    if (existsSync(indexHtml) && statSync(indexHtml).isFile()) count++;
  }
  return count;
}

// /work itself (the unfiltered reel) lives at build/work/index.html.
const workIndex = join(BUILD, 'work', 'index.html');
const workIndexExists = existsSync(workIndex);

// /work/[category]: 8 subdirs each with an index.html.
const workCategoryDirs = countPrerendered(join(BUILD, 'work'));

// /watch/[id]: 56 subdirs each with an index.html.
const watchIdDirs = countPrerendered(join(BUILD, 'watch'));

const expectedCategorySlugs = 8;
const expectedVideoIds = 56;

const failures = [];

if (!workIndexExists) {
  failures.push('Missing build/work/index.html (the unfiltered /work route).');
}
if (workCategoryDirs < expectedCategorySlugs) {
  failures.push(
    `Expected ≥${expectedCategorySlugs} build/work/<slug>/index.html files; found ${workCategoryDirs}.`,
  );
}
if (watchIdDirs < expectedVideoIds) {
  failures.push(
    `Expected ≥${expectedVideoIds} build/watch/<id>/index.html files; found ${watchIdDirs}.`,
  );
}

// Phase 6: /pbs-american-portrait/ — flat parameterless prerendered route.
const pbsLandingIndex = join(BUILD, 'pbs-american-portrait', 'index.html');
const pbsLandingExists = existsSync(pbsLandingIndex);
if (!pbsLandingExists) {
  failures.push(
    'Missing build/pbs-american-portrait/index.html (the PBS American Portrait landing route).',
  );
}

// Phase 6: /press — broadcast credits landing route.
const pressIndex = join(BUILD, 'press', 'index.html');
const pressIndexExists = existsSync(pressIndex);
if (!pressIndexExists) {
  failures.push('Missing build/press/index.html (the broadcast credits landing route).');
}

// Phase 6: /about — bio + contact block landing route.
const aboutIndex = join(BUILD, 'about', 'index.html');
const aboutIndexExists = existsSync(aboutIndex);
if (!aboutIndexExists) {
  failures.push('Missing build/about/index.html (the /about page).');
}

// Phase 6: /contact — h1 + shared contact block.
const contactIndex = join(BUILD, 'contact', 'index.html');
const contactIndexExists = existsSync(contactIndex);
if (!contactIndexExists) {
  failures.push('Missing build/contact/index.html (the /contact page).');
}

// Phase 7 (Plan 07-01 / D-14): sitemap.xml — build-time-generated sitemap.
const sitemapPath = join(BUILD, 'sitemap.xml');
const sitemapExists = existsSync(sitemapPath);
let sitemapUrlCount = 0;
if (!sitemapExists) {
  failures.push('Missing build/sitemap.xml (the D-14 sitemap endpoint).');
} else {
  // Count <url> entries; expect at least 70 (6 static + 8 categories + 56 watch).
  const content = readFileSync(sitemapPath, 'utf8');
  sitemapUrlCount = (content.match(/<url>/g) ?? []).length;
  if (sitemapUrlCount < 70) {
    failures.push(
      `build/sitemap.xml has only ${sitemapUrlCount} <url> entries; expected ≥70 (6 static + 8 categories + 56 watch).`,
    );
  }
}

// Phase 7 (Plan 07-02): favicon set + OG image binary assets.
const requiredStaticAssets = [
  'favicon.ico',
  'favicon-16.png',
  'favicon-32.png',
  'favicon-192.png',
  'favicon-512.png',
  'apple-touch-icon.png',
  'og-image.jpg',
];
const missingAssets = requiredStaticAssets.filter((name) => !existsSync(join(BUILD, name)));
if (missingAssets.length > 0) {
  failures.push(`Missing required static assets in build/: ${missingAssets.join(', ')}`);
}

if (failures.length > 0) {
  console.error('[test-prerender-coverage] FAIL:');
  for (const f of failures) console.error('  - ' + f);
  console.error(
    `Found: build/work/index.html=${workIndexExists}, build/work/<slug>/index.html count=${workCategoryDirs}, build/watch/<id>/index.html count=${watchIdDirs}, build/pbs-american-portrait/index.html=${pbsLandingExists}, build/press/index.html=${pressIndexExists}, build/about/index.html=${aboutIndexExists}, build/contact/index.html=${contactIndexExists}, build/sitemap.xml=${sitemapExists} (${sitemapUrlCount} URLs).`,
  );
  process.exit(1);
}

console.log('[test-prerender-coverage] PASS:');
console.log(`  - build/work/index.html: present`);
console.log(
  `  - build/work/<slug>/index.html: ${workCategoryDirs} files (expected ≥${expectedCategorySlugs})`,
);
console.log(`  - build/watch/<id>/index.html: ${watchIdDirs} files (expected ≥${expectedVideoIds})`);
console.log(`  - build/pbs-american-portrait/index.html: present`);
console.log(`  - build/press/index.html: present`);
console.log(`  - build/about/index.html: present`);
console.log(`  - build/contact/index.html: present`);
console.log(`  - build/sitemap.xml: present (${sitemapUrlCount} URLs)`);
console.log(
  `  - build/{favicon.ico, favicon-{16,32,192,512}.png, apple-touch-icon.png, og-image.jpg}: all present`,
);
process.exit(0);
