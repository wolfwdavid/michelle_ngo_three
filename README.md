# Michelle Ngo Portfolio — Cinematic Cut (`_three`)

Cinematic-immersive A/B sibling of [`michelle_ngo_four`](../michelle_ngo_four), the editorial-modern v1. Same 56 videos, same SvelteKit 2 + Svelte 5 + TypeScript strict + Tailwind v4 stack — different visual language: dark full-bleed, scroll-snapped fullscreen reels with silent muted preview loops.

See `.planning/PROJECT.md` for the full project brief and `.planning/ROADMAP.md` for the 7-phase delivery plan.

## Local development

```bash
pnpm install
pnpm dev       # local dev server
pnpm build     # static build into ./build
pnpm check     # svelte-check (type-check)
pnpm lint      # eslint
pnpm format    # prettier --write
pnpm test      # vitest (unit + component)
pnpm test:e2e  # playwright (e2e + axe)
```

## Deployment

Auto-deploys on push to `main` → `https://wolfwdavid.github.io/michelle_ngo_three/` via GitHub Actions. Production cutover to `michellengo.net` is gated on the `_three` vs `_four` A/B decision (Phase 7).
