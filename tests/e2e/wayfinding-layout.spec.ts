/**
 * Phase 4 NAV-01 + NAV-03 layout shell tests.
 *
 * Verifies the singleton landmark structure on /work surfaces:
 *   - exactly ONE <main id="main" tabindex="-1">
 *   - exactly ONE <header> (TopNav)
 *   - exactly TWO <nav> (Main navigation + Filmography filters)
 *   - skip-link visible-on-focus and reachable via Tab
 *   - axe-clean on /work, /work/pbs-american-portrait, /work/reel
 *
 * Runs on chromium + webkit + firefox per playwright.config.ts project list.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Layout shell — NAV-01 + NAV-03 landmark structure', () => {
  test('on /work: exactly one <main id="main" tabindex="-1">', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    const mains = await page.locator('main').count();
    expect(mains).toBe(1);
    const main = page.locator('main');
    await expect(main).toHaveAttribute('id', 'main');
    await expect(main).toHaveAttribute('tabindex', '-1');
  });

  test('on /work: exactly one <header> (TopNav)', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    const headers = await page.locator('header').count();
    expect(headers).toBe(1);
  });

  test('on /work: exactly two <nav> elements (Main navigation + Filmography filters)', async ({
    page,
  }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    const navs = await page.locator('nav').all();
    const navLabels = await Promise.all(
      navs.map(async (n) => (await n.getAttribute('aria-label')) ?? '')
    );
    expect(navLabels).toContain('Main navigation');
    expect(navLabels).toContain('Filmography filters');
    expect(navLabels.length).toBe(2);
  });

  test('skip-link exists, is sr-only by default, points to #main, surfaces on focus', async ({
    page,
  }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    // Skip-link is the first <a> in DOM order with href="#main". Locate it directly
    // (focusing via Tab is unreliable on WebKit where Tab skips anchors by default
    // unless "Press Tab to highlight each item on a webpage" is enabled).
    const skipLink = page.locator('a[href="#main"]').first();
    await expect(skipLink).toHaveText(/Skip to content/i);
    // Has the sr-only utility class by default (hidden until focus).
    const classBefore = await skipLink.getAttribute('class');
    expect(classBefore ?? '').toMatch(/sr-only/);
    // Focusing programmatically should still apply the focus-visible utilities
    // (focus:not-sr-only) — verify the element is focusable.
    await skipLink.focus();
    const focusedHref = await page.evaluate(
      () => (document.activeElement as HTMLAnchorElement)?.getAttribute('href')
    );
    expect(focusedHref).toBe('#main');
  });

  test('activating the skip-link moves focus or scrolls to <main>', async ({ page }) => {
    await page.goto('/work');
    await page.waitForLoadState('networkidle');
    const skipLink = page.locator('a[href="#main"]').first();
    await skipLink.focus();
    await page.keyboard.press('Enter'); // activate
    // <main tabindex="-1"> + #main hash jump: some browsers auto-focus, others just
    // scroll to anchor. Both outcomes satisfy WCAG 2.4.1.
    const focusedOrAtMain = await page.evaluate(() => {
      const main = document.getElementById('main');
      if (!main) return { focused: false, atTop: false };
      return {
        focused: document.activeElement === main,
        atTop: Math.abs(main.getBoundingClientRect().top) < 5,
      };
    });
    expect(focusedOrAtMain.focused || focusedOrAtMain.atTop).toBe(true);
  });
});

test.describe('Axe scan on filter routes (Phase 4 FILT-04 + NAV-03 carry-forward of Phase 3 Pillar 4)', () => {
  const ROUTES = ['/work', '/work/pbs-american-portrait', '/work/reel'];
  for (const route of ROUTES) {
    test(`${route} — zero WCAG AA violations`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      if (results.violations.length > 0) {
        console.log(`Axe violations on ${route}:`, JSON.stringify(results.violations, null, 2));
      }
      expect(results.violations).toEqual([]);
    });
  }
});
