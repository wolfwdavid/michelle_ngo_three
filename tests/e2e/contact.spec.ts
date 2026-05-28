/**
 * Playwright e2e for the Phase 6 Plan 06-03 /contact surface.
 * CONT-01 (cross-surface) + CONT-02 (fallback URLs) + CONT-03 (Footer reveal).
 *
 * Coverage:
 *   - splash renders MICHELLE NGO wordmark + ContactBlock + ↓ scroll-cue
 *   - scroll past h-svh splash reveals the site-wide Footer (CONT-03)
 *   - ContactBlock cross-surface count: /contact = 2, /about = 2, /work = 1 (CONT-01)
 *   - IMDb/LinkedIn/Vimeo hrefs contain channel-homepage fallback domains (CONT-02)
 *   - axe-core WCAG AA scan: zero violations
 *
 * Cross-browser: chromium + webkit + firefox per playwright.config.ts.
 * trailingSlash='always' (06-01) → navigate with trailing slashes.
 */
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('/contact — CONT-01 + CONT-02 + CONT-03 cross-surface', () => {
  test('splash renders with MICHELLE NGO wordmark + ContactBlock + scroll-cue', async ({
    page,
  }) => {
    await page.goto('/contact/');
    await expect(page.getByText('MICHELLE NGO', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'mynogo@gmail.com' }).first()).toBeVisible();
    await expect(page.locator('[aria-hidden="true"]:has-text("↓")').first()).toBeAttached();
  });

  test('scroll past splash reveals site-wide Footer (CONT-03)', async ({ page }) => {
    await page.goto('/contact/');
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    // Footer has 3 column headers at lg breakpoint — check presence.
    await expect(footer.locator('h3:has-text("Contact")')).toBeVisible();
    await expect(footer.locator('h3:has-text("Work")')).toBeVisible();
    await expect(footer.locator('h3:has-text("Site")')).toBeVisible();
  });

  test('ContactBlock cross-surface presence (CONT-01)', async ({ page }) => {
    // /contact: splash ContactBlock (5 channels) + Footer column 1 ContactBlock (5) = 2 mailto links
    await page.goto('/contact/');
    await expect(page.getByRole('link', { name: 'mynogo@gmail.com' })).toHaveCount(2);
    // /about: Act 2 ContactBlock (5) + Footer column 1 ContactBlock (5) = 2 mailto links
    await page.goto('/about/');
    await expect(page.getByRole('link', { name: 'mynogo@gmail.com' })).toHaveCount(2);
    // /work: only Footer column 1 ContactBlock = 1 mailto link (no ContactBlock on reel surface)
    await page.goto('/work/');
    await expect(page.getByRole('link', { name: 'mynogo@gmail.com' })).toHaveCount(1);
  });

  test('CONT-02 — IMDb/LinkedIn/Vimeo URLs contain channel-homepage fallback domains', async ({
    page,
  }) => {
    await page.goto('/contact/');
    const imdbLink = page.getByRole('link', { name: 'IMDb' }).first();
    await expect(imdbLink).toHaveAttribute('href', /imdb\.com/);
    const linkedinLink = page.getByRole('link', { name: 'LinkedIn' }).first();
    await expect(linkedinLink).toHaveAttribute('href', /linkedin\.com/);
    const vimeoLink = page.getByRole('link', { name: 'Vimeo' }).first();
    await expect(vimeoLink).toHaveAttribute('href', /vimeo\.com/);
  });

  test('axe-core WCAG AA scan — zero violations', async ({ page }) => {
    await page.goto('/contact/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
