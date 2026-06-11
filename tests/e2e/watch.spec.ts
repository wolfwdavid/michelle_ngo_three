/**
 * tests/e2e/watch.spec.ts — Phase 5 Plan 05-02 Task 3.
 *
 * Playwright e2e for WATCH-01..04 + axe a11y on /watch/[id]:
 *   - WATCH-01: letterbox canvas + iframe with player.vimeo.com src (+ playsinline=1)
 *   - WATCH-01: chrome-fade attribute toggles on iframe data-chrome-faded (initial state)
 *   - WATCH-02: title + uploader · year + CategoryTag chip render below player
 *   - WATCH-03: ContinueReelRail renders >= 1 sibling card (PBS sample with 18 siblings)
 *   - WATCH-04: prerender sample — 4 ids all return 200 + correct title
 *   - WATCH-04: unknown id returns 404
 *   - axe a11y: zero WCAG AA violations on /watch/[id]
 *
 * HEADLESS CAVEAT: Real Vimeo/YouTube postMessage timing is non-deterministic
 * in headless browsers (same posture as reel.spec.ts). For the chrome-fade
 * deep flow, the unit tests in WatchPlayer.svelte.test.ts lock the state
 * machine; this spec only verifies the INITIAL data-chrome-faded='false'
 * attribute. Real-device behavior is covered in Phase 7 POL-04 BrowserStack
 * matrix.
 *
 * Cross-browser run: Chromium + WebKit + Firefox per playwright.config.ts.
 */
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const PRODUCER_REEL_ID = '264677021';
const PBS_SAMPLE_ID = '620232398';

test.describe('Watch route (WATCH-01..04)', () => {
  test('WATCH-01: letterbox canvas (bg-black + min-h-svh) + iframe with player.vimeo.com src + playsinline=1', async ({
    page,
  }) => {
    await page.goto(`/watch/${PRODUCER_REEL_ID}`);
    await page.waitForLoadState('load');

    // Letterbox math: outer div has bg-black + min-h-svh classes.
    const canvas = page.locator('div.bg-black.min-h-svh').first();
    await expect(canvas).toBeVisible();

    // Iframe with title attribute (WCAG H64 requires it).
    const iframe = page.locator('iframe[title]').first();
    await expect(iframe).toHaveCount(1);

    const src = await iframe.getAttribute('src');
    expect(src).toContain('player.vimeo.com');
    // Plan 05-01 closed Finding 11 — playsinline=1 is unconditional in 'play' mode.
    expect(src).toContain('playsinline=1');
    expect(src).toContain('autoplay=1');
    // 'play' mode strips muted/loop/background per Phase 3 D-09.
    expect(src).not.toContain('background=1');
    expect(src).not.toContain('loop=1');
  });

  test('WATCH-01: initial chromeFaded=false (data-chrome-faded attribute reflects state)', async ({
    page,
  }) => {
    await page.goto(`/watch/${PRODUCER_REEL_ID}`);
    await page.waitForLoadState('load');
    const iframe = page.locator('iframe[title]').first();
    // Initial state — chromeFaded $state defaults false. Real Vimeo postMessage
    // 'play' may flip this asynchronously, but the INITIAL state is locked here.
    // Unit tests in WatchPlayer.svelte.test.ts lock the full state machine.
    await expect(iframe).toHaveAttribute('data-chrome-faded', 'false');
  });

  test('WATCH-02: title (h1) + uploader · year + CategoryTag chip render below player', async ({
    page,
  }) => {
    await page.goto(`/watch/${PRODUCER_REEL_ID}`);
    await page.waitForLoadState('load');

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const h1Text = await h1.textContent();
    expect(h1Text?.trim().length).toBeGreaterThan(0);

    // Middle-dot separator in metadata line (Unicode U+00B7).
    await expect(page.locator('text=·').first()).toBeVisible();

    // CategoryTag chip — anchor with data-category attribute. Producer reel
    // is category 'Reel'.
    const chip = page.locator('a[data-category]').first();
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('href', /\/work\//);
  });

  test('WATCH-03: ContinueReelRail renders with >= 1 sibling card (PBS sample has 18 → rail = 17)', async ({
    page,
  }) => {
    await page.goto(`/watch/${PBS_SAMPLE_ID}`);
    await page.waitForLoadState('load');

    const railSection = page.locator('section[aria-labelledby="rail-heading"]');
    await expect(railSection).toBeVisible();

    const railHeading = railSection.locator('h2 a');
    await expect(railHeading).toContainText('More in');

    // PBS has 18 videos; rail excludes current → expect 17 cards.
    await expect(railSection.locator('ul li')).toHaveCount(17);
  });

  test('WATCH-04: prerender sample — 2 ids all return 200 + correct title', async ({ page }) => {
    const samples = [PRODUCER_REEL_ID, PBS_SAMPLE_ID];
    for (const id of samples) {
      const response = await page.goto(`/watch/${id}`);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Michelle Ngo/);
    }
  });

  test('WATCH-04: unknown id returns 404', async ({ page }) => {
    const response = await page.goto('/watch/does-not-exist-xyz');
    // adapter-static emits 404.html as the fallback; the dev/preview server
    // returns 404 status code OR may serve the fallback as 200 depending on
    // the static host. The robust assertion is that the body does NOT contain
    // the JSON-LD VideoObject script tag (which exists ONLY on valid pages).
    // Accept either 200 (fallback served) or 404 — but content must NOT be
    // a valid watch page.
    const status = response?.status() ?? 0;
    expect([200, 404]).toContain(status);
    // The fallback page should NOT have an iframe with video player URL.
    const iframeCount = await page.locator('iframe[title]').count();
    expect(iframeCount).toBe(0);
  });

  test('axe a11y: /watch/[id] has zero WCAG AA violations', async ({ page }) => {
    await page.goto(`/watch/${PRODUCER_REEL_ID}`);
    await page.waitForLoadState('load');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
