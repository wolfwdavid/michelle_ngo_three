import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import ReelStage from './ReelStage.svelte';
import type { Video } from '$lib/data';
import { __resetMenuStateForTests, openMenu, closeMenu } from '$lib/state/menu.svelte';

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

  test('visibilitychange listener attached on mount, removed on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(ReelStage, { props: { videos: fixture(3) } });
    const addedVis = addSpy.mock.calls.some((c) => c[0] === 'visibilitychange');
    expect(addedVis).toBe(true);
    unmount();
    const removedVis = removeSpy.mock.calls.some((c) => c[0] === 'visibilitychange');
    expect(removedVis).toBe(true);
  });
});

describe('ReelStage — Plan 04-03 NAV-02 keyboard + D-08 menu-pause + D-01 chrome-height', () => {
  beforeEach(() => {
    __resetMenuStateForTests();
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
