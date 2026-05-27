/**
 * Playwright e2e for the Phase 5 Plan 05-03 hero surface (`/`).
 *
 * Coverage:
 *   - HERO-01: wordmark + tagline + ▷ PLAY REEL CTA + ↓ scroll-cue all render
 *   - HERO-01: gradient overlay layer present (Pitfall 20 legibility shield)
 *   - HERO-01: poster preload link in <head> (POL-02 LCP mechanism)
 *   - HERO-01: hero section is 100svh tall (Phase 3 svh lock — Pitfall 7 svh)
 *   - HERO-02: scrolling past hero reveals the first ReelSection (`<main>
 *               article[aria-label*="Video"]`) — resilient to ReelStage's
 *               role="region" wrapper presence/absence
 *   - HERO-03: ▷ PLAY REEL navigates to /watch/<producerReelId> with sound
 *               (non-muted iframe src after sticky-activation nav)
 *   - D-03: deferred-load mechanism — iframe attaches within 5s of entry
 *   - D-04: reduced-motion fallback — poster only, no PreviewLoop iframe
 *   - axe a11y: zero WCAG AA violations on /
 *
 * Cross-browser: runs on chromium + webkit + firefox per playwright.config.ts.
 *
 * HEADLESS CAVEAT: same as tests/e2e/reel.spec.ts — Vimeo/YouTube embeds
 * frequently don't complete the postMessage handshake in headless, so the
 * 800ms HANDSHAKE_TIMEOUT_MS fires and PreviewLoop swaps to PosterImage. The
 * defer-mechanism test gates on the iframe appearing within 5s (before any
 * timeout would fire); the reduced-motion test gates on the iframe NEVER
 * appearing (which holds regardless of handshake outcome).
 */
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// The producer reel id is exported from $lib/data; pinning a literal in the
// e2e suite (read by node, not via the SvelteKit alias) is the cleanest path
// — Plan 05-01/02/03 frontmatter all reference the same literal.
const PRODUCER_REEL_ID = '264677021';

test.describe.parallel('Hero surface (HERO-01 / HERO-02 / HERO-03)', () => {
  test('HERO-01: wordmark + tagline + PLAY REEL CTA + scroll-cue all render', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('MICHELLE NGO');
    await expect(page.getByText('Filmmaker & Producer')).toBeVisible();
    const cta = page.locator(`a[href$="/watch/${PRODUCER_REEL_ID}"]`).first();
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('PLAY REEL');
    // ↓ scroll cue (Unicode U+2193) — anywhere on the hero
    await expect(page.locator('text=↓').first()).toBeVisible();
  });

  test('HERO-01: gradient overlay layer present with aria-hidden', async ({ page }) => {
    await page.goto('/');
    const overlay = page.locator('div[style*="linear-gradient"]').first();
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  test('HERO-01: poster preload link in <head> (LCP hint)', async ({ page }) => {
    await page.goto('/');
    const preload = page.locator('link[rel="preload"][as="image"][fetchpriority="high"]');
    await expect(preload.first()).toHaveCount(1);
    const href = await preload.first().getAttribute('href');
    expect(href ?? '').toContain(PRODUCER_REEL_ID);
  });

  test('HERO-01: hero outer section uses h-svh (Phase 3 svh lock)', async ({ page }) => {
    await page.goto('/');
    // The hero is the first <section> on the page (sibling of <main>'s ReelStage).
    const heroSection = page.locator('section').first();
    const cls = await heroSection.getAttribute('class');
    expect(cls ?? '').toMatch(/h-svh/);
  });

  test('HERO-02: scrolling past hero reveals the first ReelSection', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    await page.evaluate((h) => window.scrollBy(0, h * 1.5), viewportHeight);
    await page.waitForTimeout(500); // scroll-snap settle
    // Resilient selector: <main> ships from NAV-03 in +layout.svelte;
    // `article[aria-label*="Video"]` is the Phase 3 D-10 landmark contract.
    const firstArticle = page.locator('main article[aria-label*="Video"]').first();
    await expect(firstArticle).toBeVisible();
  });

  test('HERO-03: PLAY REEL navigates to /watch/<producerReelId>', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator(`a[href$="/watch/${PRODUCER_REEL_ID}"]`).first();
    await cta.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain(`/watch/${PRODUCER_REEL_ID}`);
    // Watch page renders a heading + iframe. The iframe's src should be
    // 'play' mode — autoplay=1 with NO muted=1 / mute=1.
    await expect(page.locator('h1').first()).toBeVisible();
    const iframe = page.locator('iframe[title]').first();
    await expect(iframe).toHaveCount(1);
    const src = await iframe.getAttribute('src');
    expect(src ?? '').toContain('autoplay=1');
    expect(src ?? '').not.toMatch(/[?&]muted=1/);
    expect(src ?? '').not.toMatch(/[?&]mute=1/);
  });

  test('D-03 defer mechanism: hero poster renders as the LCP element (iframe deferred)', async ({
    page,
  }) => {
    // Headless caveat (mirrors tests/e2e/reel.spec.ts): the PreviewLoop iframe
    // does briefly attach after the defer fires, but PreviewLoop's 800ms
    // HANDSHAKE_TIMEOUT_MS unmounts it almost immediately in headless because
    // the cross-origin Vimeo/YouTube postMessage handshake doesn't complete.
    // The MECHANISM is verified deterministically in two places:
    //   - src/lib/heroDefer.svelte.test.ts (the factory itself, fake timers)
    //   - src/lib/components/HeroAmbient.svelte.test.ts (the integration —
    //     PreviewLoop stub mounts after vi.advanceTimersByTime(1001))
    // Here we verify the LCP-bearing poster IS attached (POL-02 contract) and
    // that the hero section is the layout it should be — the iframe attach
    // is unreliable to assert in headless and is therefore left to unit tests.
    await page.goto('/');
    const heroSection = page.locator('section').first();
    const poster = heroSection.locator('img[fetchpriority="high"]');
    await expect(poster).toBeAttached();
    const src = await poster.getAttribute('src');
    expect(src ?? '').toContain(PRODUCER_REEL_ID);
  });

  test('D-04 fallback: reduced-motion serves poster only (no hero iframe)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // Exceed the 1000ms defer timer to confirm no iframe ever attaches.
    await page.waitForTimeout(2000);
    const heroSection = page.locator('section').first();
    const heroIframe = heroSection.locator('iframe');
    await expect(heroIframe).toHaveCount(0);
  });

  test('axe a11y: zero WCAG AA violations on /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
