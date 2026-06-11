/**
 * Phase 6 Plan 06-02 — /pbs-american-portrait/ Playwright e2e spec.
 *
 * Covers:
 *   A. Verbatim Candidate C blockquote text visible (PBS-01 / D-17)
 *   B. 18 <article> sections render (PBS-01)
 *   C. Exactly 15 "See on PBS →" anchors present (PBS-02 — 3 missing by design)
 *   D. TopNav PBS active state on /pbs-american-portrait/ AND /work/pbs-american-portrait/
 *      (PBS-03 — shipped Phase 4; regression-verified here)
 *   E. axe-core zero AA violations on /pbs-american-portrait/
 *
 * Runs on chromium + webkit + firefox per playwright.config.ts project list.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PBS_URL = '/pbs-american-portrait/';
const WORK_PBS_URL = '/work/pbs-american-portrait/';

test.describe('/pbs-american-portrait/ — Phase 6 PBS-01/02/03', () => {
  test('A — verbatim Candidate C blockquote text is visible (D-17)', async ({ page }) => {
    await page.goto(PBS_URL);
    await page.waitForLoadState('load');
    const blockquote = page.locator('blockquote').first();
    await expect(blockquote).toBeVisible();
    const text = (await blockquote.textContent()) ?? '';
    expect(text).toContain('joy or sorrow');
    expect(text).toContain('Americans to be heard.');
  });

  test('B — 18 <article> landmarks render (PBS-01)', async ({ page }) => {
    await page.goto(PBS_URL);
    await page.waitForLoadState('load');
    const articleCount = await page.locator('article').count();
    expect(articleCount).toBe(18);
  });

  test('C — exactly 15 "See on PBS →" anchors visible (PBS-02 — 3 missing by design)', async ({
    page,
  }) => {
    await page.goto(PBS_URL);
    await page.waitForLoadState('load');
    // Locate by text — match the literal "See on PBS" substring (arrow may render
    // differently across engines, the prefix is the stable assertion).
    const badges = page.getByText('See on PBS', { exact: false });
    const count = await badges.count();
    expect(count).toBe(15);
  });

  test('D — TopNav PBS link is active on /pbs-american-portrait/ (PBS-03 dual-route part 1)', async ({
    page,
  }) => {
    await page.goto(PBS_URL);
    await page.waitForLoadState('load');
    // TopNav PBS link uses href="${base}/work/pbs-american-portrait" and isActive()
    // sets aria-current="page" when the URL ends with /pbs-american-portrait (with
    // trailing slash normalized). Match by aria-current="page" in TopNav scope.
    const navLinks = page.locator(
      'header nav[aria-label="Main navigation"] a[aria-current="page"]'
    );
    const text = (await navLinks.allTextContents()).join('|').toLowerCase();
    expect(text).toContain('pbs american portrait');
  });

  test('D — TopNav PBS link is active on /work/pbs-american-portrait/ (PBS-03 dual-route part 2)', async ({
    page,
  }) => {
    await page.goto(WORK_PBS_URL);
    await page.waitForLoadState('load');
    const navLinks = page.locator(
      'header nav[aria-label="Main navigation"] a[aria-current="page"]'
    );
    const text = (await navLinks.allTextContents()).join('|').toLowerCase();
    expect(text).toContain('pbs american portrait');
  });

  test('E — axe-core zero WCAG AA violations on /pbs-american-portrait/', async ({ page }) => {
    await page.goto(PBS_URL);
    await page.waitForLoadState('load');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    if (results.violations.length > 0) {
      // Log violations to assist debugging without aborting the suite layout.
      console.log(
        'Axe violations on /pbs-american-portrait/:',
        JSON.stringify(results.violations, null, 2)
      );
    }
    expect(results.violations).toEqual([]);
  });
});
