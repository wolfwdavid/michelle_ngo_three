/**
 * Phase 4 FILT-01 / FILT-02 / FILT-03 filter-routing pillar.
 *
 * Verifies on chromium + webkit + firefox:
 *   - Pill tap navigates to /work/[category]; URL bar reflects the change
 *   - Reel re-renders with the category-narrowed video count
 *   - aria-current="page" moves to the active pill
 *   - Reload on /work/[category] preserves the filter (prerendered HTML
 *     first-paint)
 *   - Malformed slug returns 404 (or 404 fallback marker in body)
 */
import { test, expect } from '@playwright/test';

test.describe('Filter pill navigation (FILT-01 / FILT-02)', () => {
  test('tap PBS pill -> navigate to /work/pbs-american-portrait + 18 articles', async ({
    page,
  }) => {
    await page.goto('/work');
    await page.waitForLoadState('load');
    const pbsLink = page
      .locator('nav[aria-label="Filmography filters"] a[href$="/work/pbs-american-portrait"]')
      .first();
    await pbsLink.click();
    await page.waitForURL(/\/work\/pbs-american-portrait/);
    await page.waitForLoadState('load');
    const articleCount = await page.locator('article').count();
    expect(articleCount).toBe(18);
    const ariaCurrent = await page
      .locator('nav[aria-label="Filmography filters"] [aria-current="page"]')
      .textContent();
    expect(ariaCurrent?.trim()).toBe('PBS American Portrait');
  });

  test('on /work/pbs-american-portrait, tapping the All pill returns to /work + 56 articles', async ({
    page,
  }) => {
    await page.goto('/work/pbs-american-portrait');
    await page.waitForLoadState('load');
    // The "All" pill href is exactly /work (the only pill with that suffix).
    const allLink = page
      .locator('nav[aria-label="Filmography filters"] a')
      .filter({ hasText: /^All$/ })
      .first();
    await allLink.click();
    await page.waitForURL((url) => /\/work\/?$/.test(url.pathname));
    // SvelteKit client-side nav rehydrates the reel; webkit + firefox can be
    // slow to swap the rendered articles after URL changes. Wait for article
    // count to reach 56 instead of relying on networkidle alone.
    await expect.poll(async () => page.locator('article').count(), { timeout: 5000 }).toBe(56);
  });
});

test.describe('Filter route prerender reproduces filter on reload (FILT-03)', () => {
  test('reload /work/pbs-american-portrait keeps the 18-article filter from first paint', async ({
    page,
  }) => {
    await page.goto('/work/pbs-american-portrait', { waitUntil: 'domcontentloaded' });
    const articleCount = await page.locator('article').count();
    expect(articleCount).toBe(18);
  });

  test('reload /work/reel preserves the Reel-narrowed filter (all articles are Reel category)', async ({
    page,
  }) => {
    await page.goto('/work/reel', { waitUntil: 'domcontentloaded' });
    const articleCount = await page.locator('article').count();
    expect(articleCount).toBeGreaterThan(0);
    // The CategoryTag rendered by ReelSection carries data-category=<Category>
    // INSIDE each <article>. (FilterPillBar's pills also carry data-category
    // — one per pill = 8 distinct categories — so the global query is too
    // wide. Scope to article descendants.) Confirm every article-internal tag
    // matches the Reel category.
    const allReel = await page.evaluate(() => {
      const tags = Array.from(document.querySelectorAll('article [data-category]'));
      if (tags.length === 0) return false;
      return tags.every((t) => t.getAttribute('data-category') === 'Reel');
    });
    expect(allReel).toBe(true);
  });
});

test.describe('Malformed slug 404 (D-16)', () => {
  test('/work/does-not-exist returns HTTP 404 OR a 404 fallback page', async ({ page }) => {
    const response = await page.goto('/work/does-not-exist');
    // SvelteKit's error(404) under adapter-static at /work/does-not-exist —
    // since the route is dynamic and prerendered for 8 slugs only, this slug
    // returns the 404.html fallback per svelte.config.js fallback setting.
    // Accept either 404 status OR a 404-page body marker.
    const status = response?.status() ?? 0;
    const bodyHas404 = await page.evaluate(() =>
      /404|not found/i.test(document.body.textContent ?? '')
    );
    expect(status === 404 || bodyHas404).toBe(true);
  });
});
