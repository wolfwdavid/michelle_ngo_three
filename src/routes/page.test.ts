import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { videos } from '$lib/data';
import { load } from './+page';
import {
  __resetMotionStateForTests,
} from '$lib/state/motion.svelte';
import {
  __resetNetworkStateForTests,
} from '$lib/state/network.svelte';
import { __resetVisibilityForTests } from '$lib/state/visibility.svelte';
import { __resetMenuStateForTests } from '$lib/state/menu.svelte';

/**
 * `/+page.ts` and `/+page.svelte` — Phase 5 Plan 05-03. HERO-01 + HERO-02.
 *
 * Replaces the Phase 1 splash placeholder. Composes <HeroAmbient /> +
 * <ReelStage videos={data.videos} /> — the cinematic-immersive entry surface.
 *
 * Test scope:
 *   - load() returns { videos } from $lib/data (identity check)
 *   - +page.svelte mounts both HeroAmbient AND ReelStage
 *
 * Mocks: HeroAmbient and ReelStage are stubbed so the test focuses on the
 * compose-shape contract, not the inner behavior (which has its own dedicated
 * test files).
 */

// vi.mock is hoisted; the dynamic imports below resolve at mock-factory time,
// before any of the test file's other imports execute. Static imports of .svelte
// stubs would themselves trigger Svelte 5's mount() side-effect on the original
// module, so we keep the dynamic-import pattern that PreviewLoop.test.ts also uses.
vi.mock('$lib/components/HeroAmbient.svelte', async () => {
  // svelte-check can't infer .svelte module declarations through a dynamic
  // import expression in a .ts file (works fine when the consuming file is
  // itself a .svelte component or in a test inside src/lib/components/).
  // ReelSection.test.ts uses the same pattern; this is the documented stop-gap.
  // @ts-expect-error -- dynamic import of .svelte stub at test-mount time
  const { default: Stub } = await import('$lib/components/__PageHeroAmbientStub.svelte');
  return { default: Stub };
});

vi.mock('$lib/components/ReelStage.svelte', async () => {
  const { default: Stub } = await import('$lib/components/__PageReelStageStub.svelte');
  return { default: Stub };
});

vi.mock('$app/paths', () => ({ base: '' }));

// Import the page LAST so the mocks above are wired before its imports resolve.
import Page from './+page.svelte';
import type { Video } from '$lib/data';

beforeEach(() => {
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  __resetVisibilityForTests();
  __resetMenuStateForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  __resetVisibilityForTests();
  __resetMenuStateForTests();
});

/**
 * SvelteKit's PageLoad return type is the union
 *   MaybePromise<void | (Omit<PageData, ...> & ...)>
 * because `() => {}` is a valid load signature (returning undefined). Our load
 * body explicitly returns `{ videos }`, but the type system doesn't narrow
 * unless we either annotate the return type at the call site or assert here.
 * Cast through the narrower test-time shape so the assertions compile cleanly.
 */
type LoadResult = { videos: readonly Video[] };

describe('/+page.ts load()', () => {
  test('returns { videos } reference (identity with $lib/data export)', () => {
    // Cast: SvelteKit's PageLoad type wants a full event with params/parent/etc;
    // our load() ignores all args so an empty object passes the body's logic.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = load({} as any) as LoadResult;
    expect(result.videos).toBe(videos);
  });

  test('load() is synchronous (NOT async — no Promise return)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = load({} as any);
    // Synchronous returns are NOT Promise instances. Even if they look thenable,
    // they shouldn't be a Promise here.
    expect(result instanceof Promise).toBe(false);
  });

  test('videos contains 56 entries (data integrity carry-over from Phase 2)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = load({} as any) as LoadResult;
    expect(result.videos.length).toBe(56);
  });
});

describe('/+page.svelte composes HeroAmbient + ReelStage', () => {
  test('mounts both HeroAmbient and ReelStage with the videos prop', () => {
    const { container } = render(Page, {
      props: { data: { videos } },
    });
    // Stubs render distinguishable data-stub attributes.
    const heroStub = container.querySelector('[data-stub="hero-ambient"]');
    const reelStub = container.querySelector('[data-stub="reel-stage"]');
    expect(heroStub).not.toBeNull();
    expect(reelStub).not.toBeNull();
    // ReelStage stub echoes the videos.length it received.
    expect(reelStub?.getAttribute('data-video-count')).toBe('56');
  });

  test('Phase 1 splash content is gone (no "Site coming soon." text)', () => {
    const { container } = render(Page, {
      props: { data: { videos } },
    });
    expect(container.textContent ?? '').not.toContain('Site coming soon');
  });
});
