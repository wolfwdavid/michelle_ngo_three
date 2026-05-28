/**
 * Playwright e2e for the Phase 6 Plan 06-03 /about surface. ABT-01 + CONT-01 (partial).
 *
 * Coverage:
 *   - Act 1 ambient hero renders with ABOUT wordmark + ↓ scroll-cue
 *   - Act 2 bio (verbatim approved substrings) + ContactBlock visible after scroll
 *   - reduced-motion degradation: REEL-04 unified codepath → poster only, no iframe
 *   - Person JSON-LD parses + sameAs URLs match ContactBlock channel domains (D-21)
 *   - axe-core WCAG AA scan: zero violations
 *
 * Cross-browser: chromium + webkit + firefox per playwright.config.ts.
 * trailingSlash='always' (06-01) → navigate to /about/ (trailing slash).
 *
 * HEADLESS CAVEAT (mirrors hero.spec.ts / reel.spec.ts): the reduced-motion test
 * gates on the iframe NEVER appearing, which holds regardless of the cross-origin
 * postMessage handshake outcome.
 */
import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('/about — ABT-01 + CONT-01 partial', () => {
  test('Act 1 ambient hero renders with ABOUT wordmark + scroll-cue', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByText('ABOUT', { exact: true })).toBeVisible();
    // scroll-cue is decorative — assert presence rather than semantic visibility
    await expect(page.locator('[aria-hidden="true"]:has-text("↓")').first()).toBeAttached();
  });

  test('Act 2 bio + ContactBlock visible after scroll', async ({ page }) => {
    await page.goto('/about/');
    await page.locator('p:has-text("I\'m Michelle Ngo")').scrollIntoViewIfNeeded();
    await expect(page.getByText("I'm Michelle Ngo, a filmmaker")).toBeVisible();
    await expect(page.getByText('If you have a project that needs a steady hand')).toBeVisible();
    // ContactBlock: /about has Act 2 ContactBlock + Footer column 1 ContactBlock.
    // Assert the first mailto link is visible (Act 2's ContactBlock).
    const channelLinks = page.locator('a:has-text("mynogo@gmail.com")');
    await expect(channelLinks.first()).toBeVisible();
  });

  test('reduced-motion: iframe never mounts — poster-only fallback', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/about/');
    // Wait for the LCP poster to render
    await expect(page.locator('img[src*="posters/"]').first()).toBeVisible();
    // Under reduced-motion, REEL-04 unified codepath gates the iframe.
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('Person JSON-LD parses with sameAs URLs matching ContactBlock channels', async ({
    page,
  }) => {
    await page.goto('/about/');
    const jsonLdText = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdText).toBeTruthy();
    const ld = JSON.parse(jsonLdText ?? '{}');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Michelle Ngo');
    expect(Array.isArray(ld.sameAs)).toBe(true);
    expect(ld.sameAs).toHaveLength(3);
    const joined = ld.sameAs.join(' ');
    expect(joined).toContain('imdb.com');
    expect(joined).toContain('linkedin.com');
    expect(joined).toContain('vimeo.com');
  });

  test('axe-core WCAG AA scan — zero violations', async ({ page }) => {
    await page.goto('/about/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
