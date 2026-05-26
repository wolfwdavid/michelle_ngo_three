/**
 * Static map from Category name -> Tailwind class string for the per-category
 * accent color (Phase 1 D-12 + Phase 4 D-02). The ONLY place a category-to-color
 * binding lives.
 *
 * Why a static literal map (not a computed slug):
 *   Tailwind v4's scanner reads source files and collects utility class names
 *   that appear LITERALLY. A dynamic `text-cat-${categoryToSlug(c)}` would
 *   compute the class at runtime but Tailwind would NEVER generate it at build
 *   time — the class wouldn't exist in the bundled CSS (Pitfall 7 carry-forward
 *   from _four/src/lib/components/categoryAccent.ts:7-13).
 *
 *   This file has every text-cat / bg-cat / ring-cat string spelled out verbatim
 *   (see the Record literals below), so the scanner finds them all and Tailwind
 *   generates utilities for each. The companion test file (categoryAccent.test.ts)
 *   pins this contract with a readFileSync().includes('text-cat-pbs') assertion
 *   so a future refactor that DRY-up s the map into a dynamic template breaks
 *   the test.
 *
 * Three accent flavors (Phase 4 D-02 active-pill compound style):
 *   text-cat-<slug>       — accent-colored text on the active pill
 *   bg-cat-<slug>/15      — accent backgrounded at low alpha (15/100)
 *   ring-cat-<slug>/40    — accent-colored ring at medium alpha (40/100)
 *
 * Adding a new category -> add to CATEGORIES (categories.ts) -> add entries
 * here -> add a --color-cat-* variable in app.css. Three lines, three files.
 */
import type { Category } from '$lib/data';

const TEXT_ACCENT: Record<Category, string> = {
  'PBS American Portrait': 'text-cat-pbs',
  'Promos & Trailers': 'text-cat-promos',
  'Branded Content': 'text-cat-branded',
  'Documentary / Short Film': 'text-cat-docshort',
  Reel: 'text-cat-reel',
  'Personal / Tribute': 'text-cat-personal',
  'Educational / Nonprofit': 'text-cat-edunon',
  Other: 'text-cat-other',
};

const BG_ACCENT: Record<Category, string> = {
  'PBS American Portrait': 'bg-cat-pbs/15',
  'Promos & Trailers': 'bg-cat-promos/15',
  'Branded Content': 'bg-cat-branded/15',
  'Documentary / Short Film': 'bg-cat-docshort/15',
  Reel: 'bg-cat-reel/15',
  'Personal / Tribute': 'bg-cat-personal/15',
  'Educational / Nonprofit': 'bg-cat-edunon/15',
  Other: 'bg-cat-other/15',
};

const RING_ACCENT: Record<Category, string> = {
  'PBS American Portrait': 'ring-cat-pbs/40',
  'Promos & Trailers': 'ring-cat-promos/40',
  'Branded Content': 'ring-cat-branded/40',
  'Documentary / Short Film': 'ring-cat-docshort/40',
  Reel: 'ring-cat-reel/40',
  'Personal / Tribute': 'ring-cat-personal/40',
  'Educational / Nonprofit': 'ring-cat-edunon/40',
  Other: 'ring-cat-other/40',
};

export function categoryAccent(category: Category): string {
  return TEXT_ACCENT[category];
}

export function categoryAccentBg(category: Category): string {
  return BG_ACCENT[category];
}

export function categoryAccentRing(category: Category): string {
  return RING_ACCENT[category];
}
