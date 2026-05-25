/**
 * Canonical category taxonomy — single source of truth.
 *
 * Source: _prep/04-categories.md (8 categories, decision rationale)
 * Decisions: D-01 (closed list), D-03 (slug rule), D-04 (display order)
 *
 * IMPORTANT: This is the seed-proposal order from _prep/04-categories.md
 * (the order curators wrote them in). It is NOT the D-04 display order —
 * getCategoriesInDisplayOrder() in the loader (Plan 02-03) re-sorts dynamically
 * per D-04 (count desc, ties alpha) from the validated dataset.
 *
 * Adding a category = one-line edit to this array. Zod's `z.enum()` reads
 * it directly; the `Category` TS type is derived; the slug rule is one function.
 */
export const CATEGORIES = [
  'PBS American Portrait',
  'Promos & Trailers',
  'Branded Content',
  'Documentary / Short Film',
  'Reel',
  'Personal / Tribute',
  'Educational / Nonprofit',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Auto-derived kebab-case slug. D-03: single rule for all categories.
 *
 * Rule: lowercase → replace any run of non-[a-z0-9] with a single hyphen → trim leading/trailing hyphens.
 *
 * Examples:
 *   'PBS American Portrait'    → 'pbs-american-portrait'
 *   'Promos & Trailers'         → 'promos-trailers'
 *   'Documentary / Short Film' → 'documentary-short-film'
 *   'Educational / Nonprofit'  → 'educational-nonprofit'
 */
export function categoryToSlug(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build the slug → category lookup once at module load (memoized).
const SLUG_TO_CATEGORY: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [categoryToSlug(c), c])
);

/**
 * Returns the Category for a given slug, or `undefined` if the slug is unknown.
 * Note: return type is `Category | undefined` because of `noUncheckedIndexedAccess`
 * (Phase 1 D-14 / tsconfig.json). Callers must narrow.
 */
export function slugToCategory(slug: string): Category | undefined {
  return SLUG_TO_CATEGORY[slug];
}
