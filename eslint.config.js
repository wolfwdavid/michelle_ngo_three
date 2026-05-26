import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/'],
  },
  // ReelSection + PosterImage both ship the `▷ PLAY WITH SOUND` deep-link to
  // /watch/[id] (REEL-05) before Phase 5 (WATCH-01) creates that route. Until
  // the route exists, `resolve('/watch/[id]', { id })` rejects the typed route
  // argument. The deprecated `${base}/watch/${video.id}` form is the
  // documented stop-gap; this override silences the linter narrowly until
  // Phase 5 lands /watch/[id] and we migrate the call. Plan 03-03 wires the
  // unified PosterImage codepath: PosterImage now ALWAYS renders the anchor
  // (the same deep-link target) so it joins ReelSection under the same
  // documented override.
  {
    files: ['src/lib/components/ReelSection.svelte', 'src/lib/components/PosterImage.svelte'],
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  // Phase 4 NAV-01 / FILT-01 / FILT-04: FilterPillBar (Plan 04-01) and TopNav +
  // MobileMenu (Plan 04-02) all consume `${base}/work/${slug}` literal href
  // construction (mirror of _four/TopNav.svelte:30). resolve('/work/[category]',
  // { category: slug }) rejects the literal-string slug at the point where the
  // TS narrowing happens, AND the unit tests assert literal hrefs against a
  // mocked base='' — resolve() output would not match. Same documented
  // stop-gap as the ReelSection/PosterImage override above. TopNav.svelte and
  // MobileMenu.svelte are pre-registered here so Plan 04-02's diff scope stays
  // limited to the component files (single source of truth for the override).
  {
    files: [
      'src/lib/components/FilterPillBar.svelte',
      'src/lib/components/TopNav.svelte',
      'src/lib/components/MobileMenu.svelte',
    ],
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  }
);
