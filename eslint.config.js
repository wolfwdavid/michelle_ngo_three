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
  // ReelSection ships the `▷ PLAY WITH SOUND` deep-link to /watch/[id]
  // (REEL-05) before Phase 5 (WATCH-01) creates that route. Until the route
  // exists, `resolve('/watch/[id]', { id })` rejects the typed route
  // argument. The deprecated `${base}/watch/${video.id}` form is the
  // documented stop-gap; this override silences the linter narrowly until
  // Phase 5 lands /watch/[id] and we migrate the call.
  {
    files: ['src/lib/components/ReelSection.svelte'],
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  }
);
