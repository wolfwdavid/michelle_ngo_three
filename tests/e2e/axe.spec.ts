import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Phase 1 SC #4 axe smoke gate. Scans `/` for WCAG 2 A + AA + best-practice
 * violations. Phase 7 (POL-04) hardens this into a blocking CI gate across
 * every route; Phase 1 just needs ONE green axe scan to prove the
 * @axe-core/playwright wiring works.
 *
 * If any violations surface in this smoke, fix them in Plan 01-02 (likely
 * candidates: missing lang on <html> — already set in app.html; or
 * insufficient contrast on the splash — D-02 + D-06 should hit AA, but
 * verify the cream-on-dark combo with the actual rendered colors).
 */
test('home / has zero axe accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  expect(results.violations).toEqual([]);
});
