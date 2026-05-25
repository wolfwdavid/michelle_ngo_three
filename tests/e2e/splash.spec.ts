import { test, expect } from '@playwright/test';

/**
 * Phase 1 SC #4 e2e smoke gate. Wordmark-agnostic so Plan 01-02 and Plan 01-03
 * can land in any order — the assertion is "the page returns 200 + <main>
 * renders," NOT "the D-01 wordmark text is present." Plan 01-02 owns the
 * wordmark; if it lands first, this test still passes; if it lands second,
 * this test still passes against Plan 01-01's stub.
 */
test('splash route returns 200 and renders <main>', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('main')).toBeVisible();
  // Page title is set by either the stub (Plan 01-01) or the D-01 splash (Plan 01-02).
  // Either way, "Michelle Ngo" should appear.
  await expect(page).toHaveTitle(/Michelle Ngo/);
});
