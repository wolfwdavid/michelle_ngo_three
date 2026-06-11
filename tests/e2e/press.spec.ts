/**
 * Phase 6 Plan 06-02 — /press Playwright e2e spec.
 *
 * Covers:
 *   A. 13 <article> sections render (PRES-01)
 *   B. Article 1 contains "HBO Max", Article 13 contains "Lenny Cooke (Movie)" (prestige order)
 *   C. Click ▷ Watch on article 1 → /watch/{video.id} (deep-link contract)
 *   D. TopNav fades during scroll on /press (D-16 — wired in 06-01; regression-verified here)
 *   E. axe-core zero AA violations on /press
 *
 * Runs on chromium + webkit + firefox per playwright.config.ts.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PRESS_URL = '/press/';

async function getHeaderClass(page: Page): Promise<string> {
  return page.evaluate(() => document.querySelector('header')?.className ?? '');
}

async function scrollPressReel(page: Page, delta: number): Promise<void> {
  await page.evaluate((d) => {
    const reel = document.querySelector(
      '[role="region"][aria-label="Press credits reel"]'
    ) as HTMLElement | null;
    reel?.scrollBy({ top: d, behavior: 'auto' });
  }, delta);
}

test.describe('/press — Phase 6 PRES-01 + D-16 chrome-fade regression', () => {
  test('A — 13 <article> landmarks render (PRES-01)', async ({ page }) => {
    await page.goto(PRESS_URL);
    await page.waitForLoadState('load');
    const count = await page.locator('article').count();
    expect(count).toBe(13);
  });

  test('B — first article on HBO Max, last on Lenny Cooke (Movie) (prestige order)', async ({
    page,
  }) => {
    await page.goto(PRESS_URL);
    await page.waitForLoadState('load');
    const articles = page.locator('article');
    const firstLabel = await articles.nth(0).getAttribute('aria-label');
    const lastLabel = await articles.nth(12).getAttribute('aria-label');
    expect(firstLabel ?? '').toMatch(/ on HBO Max$/);
    expect(lastLabel ?? '').toMatch(/ on Lenny Cooke \(Movie\)$/);
  });

  test('C — clicking ▷ Watch on article 1 navigates to /watch/<id>', async ({ page }) => {
    await page.goto(PRESS_URL);
    await page.waitForLoadState('load');
    // Find the first article's ▷ Watch CTA href; click it; assert URL matches.
    const firstWatchLink = page.locator('article').first().locator('a', { hasText: 'Watch' });
    const href = await firstWatchLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href ?? '').toMatch(/\/watch\/[\w-]+$/);
    await firstWatchLink.click();
    await page.waitForURL(/\/watch\//);
    expect(page.url()).toContain('/watch/');
  });

  test('D — TopNav fades during scroll on /press (D-16 regression — wired in 06-01)', async ({
    page,
  }) => {
    await page.goto(PRESS_URL);
    await page.waitForLoadState('load');
    // Pre-state: header is solid (not faded). Trigger scroll on the press reel
    // container — TopNav's scrollIdle.isScrolling rune flips true; chrome
    // gains opacity-0 + pointer-events-none within ~200ms.
    await scrollPressReel(page, 500);
    await page.waitForTimeout(220);
    const cls = await getHeaderClass(page);
    expect(cls).toMatch(/opacity-0/);
    expect(cls).toMatch(/pointer-events-none/);
  });

  test('E — axe-core zero WCAG AA violations on /press', async ({ page }) => {
    await page.goto(PRESS_URL);
    await page.waitForLoadState('load');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    if (results.violations.length > 0) {
      console.log('Axe violations on /press:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });
});
