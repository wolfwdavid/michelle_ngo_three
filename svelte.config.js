import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true,
    }),
    paths: {
      base: process.env.BASE_PATH ?? '',
    },
    prerender: {
      // Plan 03-01 ships /work with PosterImage referencing /posters/<source>-<id>.jpg
      // fallback paths and ReelSection's `▷ PLAY WITH SOUND` linking to
      // /watch/<id>. Plan 03-03 commits the poster artifacts; Phase 5
      // (WATCH-01) creates the /watch/[id] route. Until then, downgrade
      // strict prerender 404s on those known-pending paths to warnings so
      // the build still surfaces them in CI without aborting Phase 3 work.
      // Plan 03-03 + Phase 5 plans remove this allow-list as their routes
      // ship; anything outside the allow-list still hard-fails.
      //
      // Plan 04-02 NAV-01: TopNav + MobileMenu ship About/Press/Contact links
      // to /about, /press, /contact. Phase 6 (ABT-01, PRES-01, CONT-01) creates
      // those routes. Until then they're known-pending 404s — same posture as
      // /watch/[id] above, same documented stop-gap.
      handleHttpError: ({ path, message }) => {
        if (path.startsWith('/posters/') || path.startsWith('/watch/')) {
          console.warn(`[prerender] Expected pending 404 (Plan 03-03 / Phase 5): ${path}`);
          return;
        }
        if (path === '/about' || path === '/press' || path === '/contact') {
          console.warn(`[prerender] Expected pending 404 (Plan 04-02 NAV-01 / Phase 6): ${path}`);
          return;
        }
        throw new Error(message);
      },
    },
  },
};

export default config;
