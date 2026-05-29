import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * POL-04 axe WCAG AA gate. Phase 1 SC #4 shipped a `/`-only smoke; Plan 07-03
 * hardens it to a parametrized scan across all 7 routes (8 paths — one
 * representative /work/[category] + one /watch/[id]) with the same WCAG
 * 2 A + AA + 2.1 A + AA + best-practice tag set. Plan 07-04 flips this into a
 * blocking CI gate pre-cutover.
 *
 * Hardening from `/`-only to 7 routes exercises surfaces the smoke never
 * touched (Pitfall 7: iframe titles on PreviewLoop/WatchPlayer, sticky filter
 * pill aria-current, category accent-token contrast). Each route asserts
 * `results.violations` is empty; any genuine false-positive that must be
 * accepted is documented per-rule in the SUMMARY (no blanket rule disables).
 *
 * The preview server runs unprefixed at root (playwright.config.ts PORT 4183,
 * BASE_PATH omitted) so `page.goto('/work')` resolves at the server root.
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

const ROUTES = [
  { name: 'home /', path: '/' },
  { name: 'work', path: '/work' },
  { name: 'work category (pbs)', path: '/work/pbs-american-portrait' },
  { name: 'watch (producer reel)', path: '/watch/264677021' },
  { name: 'pbs landing', path: '/pbs-american-portrait' },
  { name: 'press', path: '/press' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
];

for (const route of ROUTES) {
  test(`${route.name} has zero axe WCAG AA violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });
}
