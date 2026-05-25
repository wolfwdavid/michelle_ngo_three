/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VideoArraySchema } from './src/lib/data/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * DATA-02: Fail `pnpm build` (and `pnpm dev` server start) on a schema violation
 * in src/lib/data/videos.json. Runs in `buildStart`, the canonical Rollup-compatible
 * lifecycle hook for fail-fast pre-bundle validation.
 *
 * Mirrored verbatim from ../michelle_ngo_four/vite.config.ts (D-21 / DATA-02).
 */
function validateVideosPlugin(): Plugin {
  return {
    name: 'validate-videos',
    buildStart() {
      const path = resolve(__dirname, 'src/lib/data/videos.json');
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(path, 'utf-8'));
      } catch (e) {
        this.error(`videos.json is not valid JSON: ${(e as Error).message}`);
        return; // unreachable — this.error throws
      }

      const result = VideoArraySchema.safeParse(raw);
      if (!result.success) {
        const pretty = z.prettifyError(result.error);
        this.error(`videos.json failed schema validation:\n${pretty}`);
        return; // unreachable
      }

      // Cross-row constraint: (source, id) must be unique across all records.
      const seen = new Set<string>();
      for (const v of result.data) {
        const key = `${v.source}:${v.id}`;
        if (seen.has(key)) {
          this.error(`videos.json: duplicate (source, id) pair: ${key}`);
          return; // unreachable
        }
        seen.add(key);
      }
    },
  };
}

export default defineConfig({
  // Plugin order matters: tailwindcss BEFORE sveltekit (Phase 1 Pattern 1);
  // validateVideosPlugin sits immediately before sveltekit() so the validation
  // failure aborts the build BEFORE Svelte starts compiling routes that import
  // the data. (Mirrors _four's plugin order.)
  plugins: [tailwindcss(), validateVideosPlugin(), sveltekit()],
  test: {
    // Phase 2 D-21 / CONTEXT Established Patterns: Vitest two-project split
    // (data=node, ui=jsdom). Each project re-declares the plugin set so
    // SvelteKit Vite plugins (tailwindcss, validateVideosPlugin, sveltekit)
    // load in BOTH projects — required for $lib/* alias resolution and
    // Svelte component compilation.
    projects: [
      {
        plugins: [tailwindcss(), validateVideosPlugin(), sveltekit()],
        test: {
          name: 'data',
          include: ['src/lib/data/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          globals: false,
        },
      },
      {
        plugins: [tailwindcss(), validateVideosPlugin(), sveltekit()],
        // `mount()` from 'svelte' resolves to svelte/src/index-server.js
        // unless we tell Vite to use browser conditions. Without this, every
        // ui test crashes with `lifecycle_function_unavailable: mount(...)
        // is not available on the server`.
        resolve: {
          conditions: ['browser'],
        },
        test: {
          name: 'ui',
          include: [
            'src/lib/components/**/*.{test,spec}.{js,ts}',
            'src/lib/**/*.{test,spec}.{js,ts}',
            'src/routes/**/*.{test,spec}.{js,ts}',
          ],
          exclude: ['src/lib/data/**'],
          environment: 'jsdom',
          globals: false,
          setupFiles: ['./vitest-setup-ui.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/data/**/*.ts'],
      exclude: ['src/lib/data/**/*.test.ts'],
    },
  },
});
