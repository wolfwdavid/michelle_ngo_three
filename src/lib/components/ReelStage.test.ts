import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import ReelStage from './ReelStage.svelte';
import type { Video } from '$lib/data';
import { __resetMenuStateForTests, openMenu, closeMenu } from '$lib/state/menu.svelte';
import { initVisibilityListener, __resetVisibilityForTests } from '$lib/state/visibility.svelte';

/**
 * ReelStage — scroll-snap container with ONE IntersectionObserver per mount
 * observing N sections. REEL-01 / REEL-03 / REEL-05 markup; REEL-07 / D-12
 * visibility broadcast.
 *
 * Strategy: replace global IntersectionObserver with a constructor spy that
 * captures the callback + options + observed targets so we can assert ONE
 * instance per stage, correct rootMargin/threshold, and drive the callback
 * with crafted entries to verify activeIdx + mountedIds behavior.
 */
interface IOSpyEntry {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observed: Element[];
  disconnected: boolean;
}

const ioInstances: IOSpyEntry[] = [];

beforeEach(() => {
  ioInstances.length = 0;
  class IntersectionObserverSpy {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit | undefined;
    observed: Element[] = [];
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = cb;
      this.options = options;
      ioInstances.push({
        callback: cb,
        options,
        observed: this.observed,
        disconnected: false,
      });
    }
    observe(target: Element): void {
      this.observed.push(target);
    }
    unobserve(): void {}
    disconnect(): void {
      const idx = ioInstances.findIndex((i) => i.callback === this.callback);
      if (idx >= 0) {
        const entry = ioInstances[idx];
        if (entry) entry.disconnected = true;
      }
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = IntersectionObserverSpy as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeVideo(id: string, title: string): Video {
  return {
    source: 'vimeo',
    id,
    title,
    uploader: 'Michelle Ngo',
    published: '2024-01-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://player.vimeo.com/video/' + id,
    category: 'Reel',
    featured: false,
    hidden: false,
    tags: [],
  };
}

function fixture(n: number): Video[] {
  return Array.from({ length: n }, (_, i) => makeVideo(`v${i + 1}`, `Sample ${i + 1}`));
}

describe('ReelStage (REEL-01 / REEL-03 / NAV-03)', () => {
  test('renders one <article> per video with aria-label "Video N of M: [title]"', () => {
    const videos = fixture(5);
    const { container } = render(ReelStage, { props: { videos } });
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(5);
    expect(articles[0]?.getAttribute('aria-label')).toBe('Video 1 of 5: Sample 1');
    expect(articles[2]?.getAttribute('aria-label')).toBe('Video 3 of 5: Sample 3');
    expect(articles[4]?.getAttribute('aria-label')).toBe('Video 5 of 5: Sample 5');
  });

  test('container is role="region" with aria-label="Filmography reel"', () => {
    const { container } = render(ReelStage, { props: { videos: fixture(3) } });
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-label')).toBe('Filmography reel');
  });

  test('container uses h-svh (or Plan 04-03 chrome-aware compound) + snap-y + snap-proximity + overscroll-y-contain + touch-pan-y', () => {
    const { container } = render(ReelStage, { props: { videos: fixture(2) } });
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    const classes = region?.className ?? '';
    // Plan 04-03 D-01: container height became h-[calc(100svh-var(--chrome-nav-height,0px)-var(--chrome-pill-height,0px))].
    // The Phase 3 h-svh literal is the fallback (no chrome on test pages); the new compound is the production form.
    expect(classes).toMatch(/h-svh|h-\[calc\(100svh/);
    expect(classes).toContain('snap-y');
    expect(classes).toContain('snap-proximity');
    expect(classes).toContain('overscroll-y-contain');
    expect(classes).toContain('touch-pan-y');
  });

  test('container does NOT use h-screen, h-dvh, snap-mandatory (Pitfall 2 + 7 locks)', () => {
    const { container } = render(ReelStage, { props: { videos: fixture(2) } });
    const region = container.querySelector('[role="region"]');
    const classes = region?.className ?? '';
    expect(classes).not.toContain('h-screen');
    expect(classes).not.toContain('h-dvh');
    expect(classes).not.toContain('snap-mandatory');
  });

  test('exactly ONE IntersectionObserver instance constructed for N sections', () => {
    const videos = fixture(5);
    render(ReelStage, { props: { videos } });
    expect(ioInstances.length).toBe(1);
    // runed observes the array of refs; we expect all N targets observed.
    expect(ioInstances[0]?.observed.length).toBe(videos.length);
  });

  test('IntersectionObserver rootMargin === "100% 0%" (D-11 eager-mount)', () => {
    render(ReelStage, { props: { videos: fixture(3) } });
    expect(ioInstances[0]?.options?.rootMargin).toBe('100% 0%');
  });

  test('IntersectionObserver threshold contains 0.5 (D-10 active discriminator)', () => {
    render(ReelStage, { props: { videos: fixture(3) } });
    const thresh = ioInstances[0]?.options?.threshold;
    const arr = Array.isArray(thresh) ? thresh : thresh !== undefined ? [thresh] : [];
    expect(arr).toContain(0.5);
  });

  test('after firing IO entries at bestIdx=2 ratio=0.6 on a 5-video stage, exactly one article per video is still rendered and articles are observable', () => {
    const videos = fixture(5);
    const { container } = render(ReelStage, { props: { videos } });
    const inst = ioInstances[0];
    expect(inst).toBeDefined();
    if (!inst) return;
    expect(inst.observed.length).toBe(5);
    // Drive the observer callback as if section index 2 is most-visible.
    const targets = inst.observed;
    const entries: IntersectionObserverEntry[] = targets.map((t, i) => ({
      target: t,
      intersectionRatio: i === 2 ? 0.6 : 0.0,
      isIntersecting: i === 2,
      boundingClientRect: t.getBoundingClientRect(),
      intersectionRect: t.getBoundingClientRect(),
      rootBounds: null,
      time: performance.now(),
    }));
    expect(() => inst.callback(entries, inst as unknown as IntersectionObserver)).not.toThrow();
    // Articles unchanged in count after callback fires.
    expect(container.querySelectorAll('article').length).toBe(5);
  });

  test('observer callback does NOT throw at boundary indices (bestIdx=0 and bestIdx=N-1)', () => {
    const videos = fixture(4);
    render(ReelStage, { props: { videos } });
    const inst = ioInstances[0];
    expect(inst).toBeDefined();
    if (!inst) return;
    const targets = inst.observed;
    // Boundary 0
    const entries0: IntersectionObserverEntry[] = targets.map((t, i) => ({
      target: t,
      intersectionRatio: i === 0 ? 0.9 : 0,
      isIntersecting: i === 0,
      boundingClientRect: t.getBoundingClientRect(),
      intersectionRect: t.getBoundingClientRect(),
      rootBounds: null,
      time: performance.now(),
    }));
    expect(() => inst.callback(entries0, inst as unknown as IntersectionObserver)).not.toThrow();
    // Boundary N-1
    const last = targets.length - 1;
    const entriesN: IntersectionObserverEntry[] = targets.map((t, i) => ({
      target: t,
      intersectionRatio: i === last ? 0.9 : 0,
      isIntersecting: i === last,
      boundingClientRect: t.getBoundingClientRect(),
      intersectionRect: t.getBoundingClientRect(),
      rootBounds: null,
      time: performance.now(),
    }));
    expect(() => inst.callback(entriesN, inst as unknown as IntersectionObserver)).not.toThrow();
  });

  test('ReelStage does NOT directly register a visibilitychange listener (Plan 05-01 Finding 10: rune owns the writer)', () => {
    __resetVisibilityForTests();
    const addSpy = vi.spyOn(document, 'addEventListener');
    render(ReelStage, { props: { videos: fixture(3) } });
    // Phase 5 Finding 10 option (a): the writer side migrated to pageVisibility
    // rune (registered ONCE at app boot via +layout.svelte's initVisibility-
    // Listener). ReelStage now only READS pageVisibility.documentHidden — it
    // must NOT register its own visibilitychange listener.
    const visCalls = addSpy.mock.calls.filter((c) => c[0] === 'visibilitychange');
    expect(visCalls.length).toBe(0);
  });
});

describe('ReelStage — Plan 04-03 NAV-02 keyboard + D-08 menu-pause + D-01 chrome-height', () => {
  beforeEach(() => {
    __resetMenuStateForTests();
    __resetVisibilityForTests();
    // jsdom doesn't implement HTMLElement.prototype.scrollIntoView — seed a
    // no-op stub so per-instance vi.spyOn() calls have a property to wrap.
    // Each test installs its own spy via vi.spyOn (auto-restored in afterEach).
    if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
      HTMLElement.prototype.scrollIntoView = function noop(): void {
        return undefined;
      };
    }
  });

  test('container has tabindex="0" and onkeydown handler (D-09)', () => {
    const { container } = render(ReelStage, { props: { videos: fixture(5) } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    expect(region).not.toBeNull();
    expect(region?.getAttribute('tabindex')).toBe('0');
  });

  test('ArrowDown dispatches scrollIntoView on the next section', () => {
    const videos = fixture(5);
    const { container } = render(ReelStage, { props: { videos } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    expect(region).not.toBeNull();

    // Drive IO callback to set activeIdx=0
    const inst = ioInstances[0];
    if (!inst) throw new Error('IO not constructed');
    const targets = inst.observed;
    const entries: IntersectionObserverEntry[] = targets.map((t, i) => ({
      target: t,
      intersectionRatio: i === 0 ? 0.9 : 0,
      isIntersecting: i === 0,
      boundingClientRect: t.getBoundingClientRect(),
      intersectionRect: t.getBoundingClientRect(),
      rootBounds: null,
      time: performance.now(),
    }));
    inst.callback(entries, inst as unknown as IntersectionObserver);

    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    region?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  test('Escape inside reel does NOT trigger scrollIntoView (D-12 — Escape is MobileMenu domain)', () => {
    const videos = fixture(3);
    const { container } = render(ReelStage, { props: { videos } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    region?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  test('Home key targets first section; End key targets last', () => {
    const videos = fixture(5);
    const { container } = render(ReelStage, { props: { videos } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    // Find the sectionRefs by their bind:this — they're the <article> children
    const articles = Array.from(container.querySelectorAll('article')) as HTMLElement[];
    expect(articles.length).toBe(5);

    const spies = articles.map((a) => vi.spyOn(a, 'scrollIntoView').mockImplementation(() => {}));
    region?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(spies[0]).toHaveBeenCalled();

    region?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(spies[4]).toHaveBeenCalled();
  });

  test('Space (no Shift) is +1; Shift+Space is -1', () => {
    const videos = fixture(5);
    const { container } = render(ReelStage, { props: { videos } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;

    // Set activeIdx=2 via IO callback
    const inst = ioInstances[0];
    if (!inst) throw new Error('IO not constructed');
    const targets = inst.observed;
    inst.callback(
      targets.map((t, i) => ({
        target: t,
        intersectionRatio: i === 2 ? 0.9 : 0,
        isIntersecting: i === 2,
        boundingClientRect: t.getBoundingClientRect(),
        intersectionRect: t.getBoundingClientRect(),
        rootBounds: null,
        time: performance.now(),
      })),
      inst as unknown as IntersectionObserver
    );

    const articles = Array.from(container.querySelectorAll('article')) as HTMLElement[];
    const spies = articles.map((a) => vi.spyOn(a, 'scrollIntoView').mockImplementation(() => {}));

    region?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(spies[3]).toHaveBeenCalled();

    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', shiftKey: true, bubbles: true })
    );
    expect(spies[1]).toHaveBeenCalled();
  });

  test('D-08: opening mobile menu flips data-doc-hidden to true', async () => {
    const videos = fixture(3);
    const { container } = render(ReelStage, { props: { videos } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    // Pre-state: documentHidden=false (no menu open, page visible)
    expect(region?.getAttribute('data-doc-hidden')).toBe('false');
    openMenu();
    await tick();
    expect(region?.getAttribute('data-doc-hidden')).toBe('true');
    closeMenu();
    await tick();
    expect(region?.getAttribute('data-doc-hidden')).toBe('false');
  });
});

/**
 * Phase 5 Plan 05-01 — D-14/D-15/D-16/D-17 hash-restoration consumer side.
 *
 * Phase 3 already WRITES `/work#video=<id>` on snap-settle (lines 117-132 in
 * ReelStage.svelte); this test block pins the new $effect that READS the hash
 * on mount and scrollIntoView's the matching article. Pitfall C: $effect (not
 * onMount) so sectionRefs[] is populated by bind:this before we read it.
 */
describe('ReelStage — Plan 05-01 D-15 hash restoration', () => {
  /**
   * Mutates window.location.hash for the test. In jsdom the hash setter is
   * writable on the location object directly, but we use the property-setter
   * idiom for explicitness — the setter triggers a hashchange event we don't
   * care about (no listener) so this is safe.
   */
  function setHash(hash: string): void {
    // jsdom: window.location.hash is writable directly.
    window.location.hash = hash;
  }

  beforeEach(() => {
    __resetMenuStateForTests();
    __resetVisibilityForTests();
    setHash('');
    if (typeof HTMLElement.prototype.scrollIntoView !== 'function') {
      HTMLElement.prototype.scrollIntoView = function noop(): void {
        return undefined;
      };
    }
  });

  afterEach(() => {
    setHash('');
  });

  test('hash restoration scrolls the matching section into view (block: start, behavior: auto)', async () => {
    const videos = fixture(5);
    const targetId = videos[2]?.id ?? 'v3';
    setHash(`#video=${targetId}`);
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    const { container } = render(ReelStage, { props: { videos } });
    await tick();
    await tick();
    expect(spy).toHaveBeenCalled();
    // The first call must request block:start + behavior:auto (D-15: NOT smooth).
    const firstCall = spy.mock.calls[0]?.[0];
    expect(firstCall).toMatchObject({ block: 'start', behavior: 'auto' });
    // The element that received scrollIntoView is the article at index 2.
    const articles = Array.from(container.querySelectorAll('article')) as HTMLElement[];
    const targetArticle = articles[2];
    expect(targetArticle).toBeDefined();
    // mock.contexts is available on Vitest 4 — the `this` of each call.
    const scrolledOnTarget = spy.mock.instances.some((inst) => inst === targetArticle);
    expect(scrolledOnTarget).toBe(true);
  });

  test('hash restoration is a no-op when window.location.hash is empty (D-15)', async () => {
    const videos = fixture(4);
    setHash('');
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    render(ReelStage, { props: { videos } });
    await tick();
    await tick();
    expect(spy).not.toHaveBeenCalled();
  });

  test('hash restoration is a no-op when hash id is not in current videos prop (D-17)', async () => {
    const videos = fixture(4);
    setHash('#video=does-not-exist');
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    render(ReelStage, { props: { videos } });
    await tick();
    await tick();
    expect(spy).not.toHaveBeenCalled();
  });

  test('hash restoration is a no-op for non-#video= fragments', async () => {
    const videos = fixture(3);
    setHash('#main');
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    render(ReelStage, { props: { videos } });
    await tick();
    await tick();
    expect(spy).not.toHaveBeenCalled();
  });

  test('hash restoration fires only ONCE per mount (idempotent — does not re-fire on subsequent reactivity)', async () => {
    const videos = fixture(5);
    const targetId = videos[1]?.id ?? 'v2';
    setHash(`#video=${targetId}`);
    const spy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    render(ReelStage, { props: { videos } });
    await tick();
    await tick();
    const initialCallCount = spy.mock.calls.length;
    expect(initialCallCount).toBeGreaterThan(0);
    // Open the mobile menu — triggers a re-evaluation of the documentHidden
    // $derived that ReelStage reads. The hash-restore $effect MUST NOT re-fire
    // because restoredFromHash is set to true on first run.
    openMenu();
    await tick();
    closeMenu();
    await tick();
    expect(spy.mock.calls.length).toBe(initialCallCount);
  });
});

/**
 * Phase 5 Plan 05-01 — Finding 10 option (a) cross-cutting check: ReelStage's
 * documentHidden context broadcast (Phase 3 D-12 reel:visibility) now flows
 * from the pageVisibility rune. Asserting via the data-doc-hidden attribute
 * verifies the wiring without mocking setContext.
 */
describe('ReelStage — Plan 05-01 pageVisibility rune subscription', () => {
  beforeEach(() => {
    __resetMenuStateForTests();
    __resetVisibilityForTests();
  });

  afterEach(() => {
    __resetMenuStateForTests();
    __resetVisibilityForTests();
  });

  test('documentHidden reflects pageVisibility rune (menu open after init)', async () => {
    const { container } = render(ReelStage, { props: { videos: fixture(2) } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    expect(region?.getAttribute('data-doc-hidden')).toBe('false');
    openMenu();
    await tick();
    expect(region?.getAttribute('data-doc-hidden')).toBe('true');
  });

  test('documentHidden reflects pageVisibility rune (document.hidden flip after init)', async () => {
    initVisibilityListener();
    const { container } = render(ReelStage, { props: { videos: fixture(2) } });
    const region = container.querySelector('[role="region"]') as HTMLElement | null;
    expect(region?.getAttribute('data-doc-hidden')).toBe('false');
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await tick();
    expect(region?.getAttribute('data-doc-hidden')).toBe('true');
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await tick();
    expect(region?.getAttribute('data-doc-hidden')).toBe('false');
  });
});
