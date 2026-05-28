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
    // Plan 06-01 cleanup: removed obsolete /posters/ + /watch/ allow-lists
    // (Phase 3 + Phase 5 shipped; all 56 poster assets + 56 watch routes exist),
    // removed /about + /press + /contact allow-lists (Phase 6 06-02 + 06-03
    // ship those routes within this same phase). Strict prerender posture
    // restored — any unexpected 404 now fails the build hard.
    //
    // Plan 06-01 commits with a KNOWN-FAILING `pnpm build` until 06-02 + 06-03
    // land the 4 new routes (/about, /press, /contact, /pbs-american-portrait).
    // This is the explicit master-broken expectation per 06-01-PLAN.md done note.
  },
};

export default config;
