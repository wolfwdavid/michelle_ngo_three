/**
 * Phase 4 D-08 mobile-menu-pause pillar.
 *
 * Mirrors tests/e2e/reel.spec.ts:186-258 (Page Visibility pause pattern).
 * Verifies on mobile viewport (<640px):
 *   - Hamburger click opens MobileMenu (role="dialog")
 *   - Within ~350ms, every mounted within-window iframe receives postMessage
 *     with "pause" in the payload (via the same documentHidden context the
 *     Page Visibility test exercises — D-08 reuses Phase 3 D-12 plumbing)
 *   - Escape closes MobileMenu (verifies D-12 keydown listener from
 *     MobileMenu.svelte Plan 04-02)
 *
 * HEADLESS CAVEAT (same as reel.spec.ts:14-19 + Plan 03-03 Pillar 5 docs):
 * postMessage handshake to Vimeo/YouTube iframes is unreliable in headless
 * mode -> iframes may not attach. The pause test skips if no iframes are
 * present; the underlying D-08 bridge contract is pinned by
 * src/lib/components/ReelStage.test.ts (jsdom, deterministic).
 */
import { test, expect } from '@playwright/test';

test.describe('D-08 mobile-menu pause (mirrors reel.spec.ts Page Visibility pattern)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('hamburger click opens MobileMenu (role="dialog")', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('load');
    await page.locator('button[aria-label="Open menu"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('opening menu dispatches postMessage "pause" within 350ms (D-08)', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('load');

    const attached = await page.locator('iframe').count();
    test.skip(
      attached === 0,
      'no iframes attached after page load (headless autoplay-blocked); D-08 bridge contract verified by ReelStage.test.ts unit suite'
    );

    // Install postMessage spy on each iframe (mirror of reel.spec.ts:208-226).
    await page.evaluate(() => {
      const captured: Array<{ data: unknown; targetOrigin: string }> = [];
      const iframes = Array.from(document.querySelectorAll('iframe'));
      iframes.forEach((iframe) => {
        const cw = iframe.contentWindow;
        if (!cw) return;
        const orig = cw.postMessage.bind(cw);
        // @ts-expect-error overriding for test
        cw.postMessage = function (msg: unknown, targetOrigin: string) {
          captured.push({ data: msg, targetOrigin });
          return orig(msg, targetOrigin);
        };
      });
      // @ts-expect-error stash on window for retrieval
      window.__capturedPostMessages = captured;
    });

    // Open the mobile menu via hamburger.
    await page.locator('button[aria-label="Open menu"]').click();

    // D-08 budget: 300ms; allow 400ms with tolerance.
    await page.waitForTimeout(400);

    const captured = await page.evaluate(() => {
      // @ts-expect-error stash on window
      return window.__capturedPostMessages as Array<{ data: unknown; targetOrigin: string }>;
    });
    const hasPauseCall = captured.some((c) => {
      const data = typeof c.data === 'string' ? c.data : JSON.stringify(c.data);
      return /pause/i.test(data);
    });
    expect(hasPauseCall).toBe(true);
  });

  test('Escape closes MobileMenu (D-12)', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('load');
    await page.locator('button[aria-label="Open menu"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });
});
