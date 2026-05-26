import { defineConfig, devices } from '@playwright/test';

// Use a non-default port (4183 instead of Vite's default 4173) so e2e runs
// don't collide with the sibling `_four` project's preview server when both
// are open in adjacent terminals during local A/B development. CI always runs
// in a fresh container so the port choice is purely a local-dev ergonomics call.
// Plan 01-03 deviation (Rule 3 - blocking fix): caught when initial e2e run
// reused sibling's preview server still listening on 4173 and got the wrong
// HTML, breaking the title assertion.
const PORT = 4183;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: {
    // E2E always runs against an unprefixed build at http://localhost:4173/.
    // The deploy workflow's e2e step deliberately OMITS BASE_PATH from its env
    // block so `pnpm build && pnpm preview` produces a build served at root
    // (no /michelle_ngo_three/ prefix). The deploy step that follows the e2e
    // step DOES set BASE_PATH for the actual GH Pages artifact build — keeping
    // e2e concerns isolated from deploy-path concerns. See
    // .github/workflows/deploy.yml for the matching comment.
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Plan 03-03 D-15 unlocks the WebKit + Firefox projects so the 4-pillar
    // suite (tests/e2e/reel.spec.ts) runs on all three engines that Phase 1
    // playwright.config.ts pre-allocated comments for. iOS Safari real-device
    // QA (D-13/D-14) still requires BrowserStack — Playwright's webkit is
    // desktop WebKit, not iOS WebKit.
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    // Build + preview against the production static output (the same artifact
    // GH Actions will upload). Catches BASE_PATH and prerender issues that a
    // `vite dev` server would hide.
    //
    // IMPORTANT: do NOT set BASE_PATH for this build — the e2e suite calls
    // page.goto('/') and expects to find the splash at the server root. The
    // deploy job (separate workflow step) handles BASE_PATH for the actual
    // GH Pages upload.
    command: `pnpm build && pnpm preview --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
