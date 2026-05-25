/**
 * Zod 4 schema for the Video data layer.
 *
 * Source decisions:
 *   D-01 / D-04: CATEGORIES list lives in ./categories (single source of truth).
 *   D-05: required fields = source, id, title, uploader, thumbnail, embed, category, published.
 *   D-06: optional fields = duration_seconds, description (UI degrades gracefully).
 *   D-07: published is ISO date string YYYY-MM-DD (Zod 4: z.iso.date()).
 *   D-08: schema-forward additions — featured (default false), hidden (default false),
 *         tags (default []), credits (optional object).
 *   D-15: schema violations fail the build (enforced by the Vite plugin in Plan 02-03).
 *
 * Why z.strictObject:
 *   Rejects unknown keys. A typo'd field name (e.g., "titel" instead of "title")
 *   would be silently dropped by z.object() — strictObject fails the build instead.
 *
 * Why z.discriminatedUnion('source', ...):
 *   Future-proofs for source-specific field divergence (e.g., a YouTube-only
 *   playlist_id). Today both branches are identical; the discriminated union
 *   gives narrower types in if (v.source === 'youtube') branches at the call site.
 *
 * Why z.iso.date():
 *   Zod 4 built-in for strict YYYY-MM-DD with zero-padding. Replaces the deprecated
 *   z.string().date() / z.string().regex(/.../) hand-rolling.
 */
import { z } from 'zod';
import { CATEGORIES } from './categories';

export const CategorySchema = z.enum(CATEGORIES);

const CommonFields = {
  id: z.string().min(1),
  title: z.string().min(1, 'title must not be empty'),
  uploader: z.string().min(1),
  published: z.iso.date(), // strict YYYY-MM-DD per Zod 4 docs
  thumbnail: z.url(),
  embed: z.url(),
  // The seed includes a top-level `url` (the human-friendly watch page URL).
  // It's not load-bearing for the site (we use `embed` for iframes), but we
  // accept it here to round-trip the JSON. Optional so future records can omit it.
  url: z.url().optional(),
  category: CategorySchema,
  description: z.string().optional(),
  duration_seconds: z.number().int().positive().optional(),
  // D-08 schema-forward additions:
  featured: z.boolean().default(false),
  hidden: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  credits: z
    .object({
      director: z.string().optional(),
      producer: z.string().optional(),
      agency: z.string().optional(),
      dop: z.string().optional(),
    })
    .optional(),
};

export const VideoSchema = z.discriminatedUnion('source', [
  z.strictObject({ source: z.literal('youtube'), ...CommonFields }),
  z.strictObject({ source: z.literal('vimeo'), ...CommonFields }),
]);

export const VideoArraySchema = z.array(VideoSchema);

export type Video = z.infer<typeof VideoSchema>;
