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
    // Plan 01-03 addition: load the @testing-library/jest-dom matchers + the
    // IntersectionObserver mock before each test file. Required for the
    // component smoke test (smoke-page.test.ts) to use .toHaveTextContent()
    // and for intersectionVisibility.test.ts to not crash on a missing IO.
    setupFiles: ['./vitest-setup-ui.ts'],
  },
  // Plan 01-03 addition: browser conditions so Svelte 5's `mount()` resolves
  // to the client build. Without this, @testing-library/svelte crashes with
  // `lifecycle_function_unavailable: mount(...) is not available on the server`.
  resolve: {
    conditions: ['browser'],
  },
});
