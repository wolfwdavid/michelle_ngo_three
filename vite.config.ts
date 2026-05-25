/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { z } from 'zod';
import { readFileSync, existsSync } from 'node:fs';
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

/**
 * Plan 03-03 D-03 / Task 5: Fail `pnpm build` if any video in videos.json
 * lacks either (a) a sidecar entry in posters.json, or (b) a file under
 * static/posters/. Mirrors validateVideosPlugin's posture (Phase 2 D-12 /
 * DATA-02): fail fast at buildStart with a literal ::error:: annotation
 * naming the missing posters and the EXACT fix command.
 *
 * Sidecar shape matches 03-01 D-02: Record<string, string> mapping
 * "{source}-{id}" -> "/posters/{source}-{id}.jpg".
 *
 * Slot in plugins array: BETWEEN validateVideosPlugin() and sveltekit() so
 * the validation aborts BEFORE Svelte starts compiling routes that import
 * the (potentially stale) posters.json.
 */
function validatePostersPlugin(): Plugin {
  return {
    name: 'validate-posters',
    buildStart() {
      const videosPath = resolve(__dirname, 'src/lib/data/videos.json');
      const sidecarPath = resolve(__dirname, 'src/lib/data/posters.json');
      const postersDir = resolve(__dirname, 'static/posters');

      const videos: Array<{ source: string; id: string }> = JSON.parse(
        readFileSync(videosPath, 'utf-8')
      );
      // Sidecar shape matches 03-01 D-02: Record<string, string>
      const sidecar: Record<string, string> = existsSync(sidecarPath)
        ? JSON.parse(readFileSync(sidecarPath, 'utf-8'))
        : {};

      const missing: string[] = [];
      for (const v of videos) {
        const key = `${v.source}-${v.id}`;
        if (!sidecar[key]) {
          missing.push(`${key} (no sidecar entry in posters.json)`);
          continue;
        }
        const filePath = resolve(postersDir, `${key}.jpg`);
        if (!existsSync(filePath)) {
          missing.push(`${key} (file missing at static/posters/${key}.jpg)`);
        }
      }

      if (missing.length > 0) {
        this.error(
          `::error::posters out of sync (${missing.length} missing):\n` +
            missing.map((m) => `  - ${m}`).join('\n') +
            `\nFix: pnpm check:embeds --posters-only && git add static/posters/ src/lib/data/posters.json`
        );
      }
    },
  };
}

export default defineConfig({
  // Plugin order matters: tailwindcss BEFORE sveltekit (Phase 1 Pattern 1);
  // validateVideosPlugin sits before sveltekit() so the validation failure
  // aborts the build BEFORE Svelte starts compiling routes that import the
  // data. (Mirrors _four's plugin order.) Plan 03-03 adds validatePostersPlugin
  // immediately after validateVideosPlugin — same fail-fast posture, gates on
  // the poster pipeline's committed-artifacts contract (D-03).
  plugins: [tailwindcss(), validateVideosPlugin(), validatePostersPlugin(), sveltekit()],
  test: {
    // Phase 2 D-21 / CONTEXT Established Patterns: Vitest two-project split
    // (data=node, ui=jsdom). Each project re-declares the plugin set so
    // SvelteKit Vite plugins (tailwindcss, validateVideosPlugin, sveltekit)
    // load in BOTH projects — required for $lib/* alias resolution and
    // Svelte component compilation.
    projects: [
      {
        plugins: [tailwindcss(), validateVideosPlugin(), validatePostersPlugin(), sveltekit()],
        test: {
          name: 'data',
          include: ['src/lib/data/**/*.{test,spec}.{js,ts}'],
          environment: 'node',
          globals: false,
        },
      },
      {
        plugins: [tailwindcss(), validateVideosPlugin(), validatePostersPlugin(), sveltekit()],
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
