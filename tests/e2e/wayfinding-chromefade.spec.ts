/**
 * Phase 4 NAV-01 / D-05 / D-06 chrome-fade pillar.
 *
 * Verifies on /work in chromium + webkit + firefox:
 *   - Reel-container scroll -> TopNav <header> gains opacity-0 +
 *     pointer-events-none within ~200ms
 *   - After 800ms (past 600ms debounce) -> header loses opacity-0
 *   - Hover pointer at top 80px while scrolling -> header loses opacity-0
 *     (surface trigger)
 *   - On / (non-reel) -> header NEVER gains opacity-0 even when scrolling
 *
 * a11y note: chrome fade is opacity-0 + pointer-events-none ONLY (never
 * display:none / visibility:hidden) so screen readers keep their landmark
 * structure during the fade.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function getHeaderClass(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector('header')?.className ?? '');
}

async function scrollReel(page: Page, delta: number): Promise<void> {
  await page.evaluate((d) => {
    const reel = document.querySelector(
      '[role="region"][aria-label="Filmography reel"]'
    ) as HTMLElement | null;
    reel?.scrollBy({ top: d, behavior: 'auto' });
  }, delta);
}

test.describe('Chrome-fade on /work (D-05 + D-06)', () => {
  test('scrolling the reel adds opacity-0 to the header within 250ms', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    await scrollReel(page, 500);
    await page.waitForTimeout(200);
    const cls = await getHeaderClass(page);
    expect(cls).toMatch(/opacity-0/);
    expect(cls).toMatch(/pointer-events-none/);
  });

  test('after 800ms (past 600ms debounce), opacity-0 is removed', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    await scrollReel(page, 500);
    await page.waitForTimeout(900);
    const cls = await getHeaderClass(page);
    expect(cls).not.toMatch(/opacity-0/);
  });

  test('hover near top while scrolling surfaces the chrome', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    await scrollReel(page, 500);
    await page.waitForTimeout(80);
    // Move mouse near top — pointermove with clientY=40 (under the 80px zone)
    await page.mouse.move(200, 40);
    await page.waitForTimeout(150);
    const cls = await getHeaderClass(page);
    expect(cls).not.toMatch(/opacity-0/);
  });
});

test.describe('Chrome-fade scope = reel routes only (D-06)', () => {
  test('on / (splash, non-reel), header does NOT gain opacity-0 even when scrolling document', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'auto' }));
    await page.waitForTimeout(200);
    const cls = await getHeaderClass(page);
    expect(cls).not.toMatch(/opacity-0/);
  });
});
