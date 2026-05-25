/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Plugin order matters: tailwindcss BEFORE sveltekit (CONTEXT Established
  // Patterns §Tailwind v4 plugin order). Phase 2 will insert the
  // validateVideosPlugin between tailwindcss() and sveltekit() — leave
  // the array shape easy to extend.
  plugins: [tailwindcss(), sveltekit()],
  test: {
    // Phase 1 minimal vitest config. Plan 01-03 wires the unit smoke test
    // into this surface; Phase 2 will split into data/ui projects.
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: false,
  },
});
