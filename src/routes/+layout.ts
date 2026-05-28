// adapter-static requires every route to be prerenderable. Set the default
// at the layout level so every child route inherits without per-page opt-in.
export const prerender = true;

// Plan 06-01 / Phase 6 RESEARCH §Routing: adopt trailingSlash='always' to
// match _four exactly. Resolves Footer column-2 PBS retarget href form
// (D-13 — _four/Footer.svelte:50-54 uses `${base}/pbs-american-portrait/`).
// Adapter-static emits build/<route>/index.html under both 'always' and
// 'never' — the difference is the canonical URL form in HTTP redirects +
// <link rel=canonical> SEO. Existing TopNav.svelte:140 endsWith() guard
// already normalizes via .replace(/\/$/, '') so active-state logic survives.
export const trailingSlash = 'always';
