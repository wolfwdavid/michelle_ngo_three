/**
 * Public surface for the data layer — `import { ... } from '$lib/data'`.
 *
 * Re-exports types (from schema.ts and categories.ts) and the typed loader
 * (from videos.ts). Every Phase 3+ route imports from here, NOT directly
 * from videos.ts/schema.ts/categories.ts (single import path = single point
 * to refactor if the internal structure changes).
 */
export type { Video } from './schema';
export type { Category } from './categories';
export { CATEGORIES, categoryToSlug, slugToCategory } from './categories';
export {
  videos,
  producerReelId,
  getById,
  getByCategory,
  getCategoriesInDisplayOrder,
  getCategoriesWithCounts,
} from './videos';
