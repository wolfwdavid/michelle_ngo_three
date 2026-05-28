/**
 * Phase 7 Plan 07-01 (POL-01 / D-14): build-time-generated sitemap.xml.
 *
 * Emits all 70 URLs across the static site:
 *   - 6 static routes: /, /work, /pbs-american-portrait, /press, /about, /contact
 *   - 8 /work/[category] routes (one per Category in display order)
 *   - 56 /watch/[id] routes (one per Video, hidden-filtered)
 *
 * Total = 6 + 8 + 56 = 70 <url> blocks.
 *
 * D-14 contract: prerendered (build emits build/sitemap.xml). The 70-URL count
 * is pinned by scripts/test-prerender-coverage.mjs.
 *
 * BASE_PATH note: this file emits ABSOLUTE production URLs (https://michellengo.net/...).
 * Staging deploys at wolfwdavid.github.io/michelle_ngo_three/ will emit a sitemap
 * with the wrong host — acceptable because (a) staging is noindex per D-03 / Trap C,
 * (b) search engines won't crawl staging, and (c) the production build with
 * BASE_PATH='' emits the same sitemap content unchanged. Do NOT make this env-aware
 * (Pitfall 4).
 */
import { videos, getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';

export const prerender = true;

const SITE = 'https://michellengo.net';
const TODAY = new Date().toISOString().slice(0, 10); // build-time lastmod

const STATIC_ROUTES = ['/', '/work/', '/pbs-american-portrait/', '/press/', '/about/', '/contact/'];

export function GET() {
  const urls: string[] = [];

  // Static routes — 6 (trailing slashes match trailingSlash='always' from Phase 6).
  for (const path of STATIC_ROUTES) {
    urls.push(`  <url><loc>${SITE}${path}</loc><lastmod>${TODAY}</lastmod></url>`);
  }

  // /work/[category] — 8 entries in display order.
  for (const category of getCategoriesInDisplayOrder()) {
    const slug = categoryToSlug(category);
    urls.push(`  <url><loc>${SITE}/work/${slug}/</loc><lastmod>${TODAY}</lastmod></url>`);
  }

  // /watch/[id] — 56 entries.
  for (const v of videos) {
    urls.push(`  <url><loc>${SITE}/watch/${v.id}/</loc><lastmod>${TODAY}</lastmod></url>`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
