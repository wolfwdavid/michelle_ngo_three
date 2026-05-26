/**
 * FilterPillBar.test.ts — unit tests for the Phase 4 sticky filter row.
 *
 * Mirrors _four/src/lib/components/TopNav.test.ts scaffold: vi.hoisted +
 * vi.mock('$app/state') + vi.mock('$app/paths') so the component sees a
 * mutable mock page object whose .url + .route the tests overwrite per case.
 *
 * Pinned behaviors:
 *   - 9 pill anchors (1 All + 8 categories) inside <nav aria-label="Filmography filters">
 *   - Every anchor has data-sveltekit-preload-data="hover" (D-15)
 *   - All pill href = `/work`; PBS pill href = `/work/pbs-american-portrait`; Reel = `/work/reel`
 *   - On /work: All pill is active (bg-neutral-50); no category pill active
 *   - On /work/pbs-american-portrait: PBS pill has text-cat-pbs accent + aria-current="page"; All inactive
 *   - On /work/pbs-american-portrait/ (trailing slash): PBS still active (endsWith normalization)
 *   - On /about: no pill active
 *   - getCategoriesInDisplayOrder() order preserved
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted lifts the mock state object so the vi.mock factory (also hoisted) can
// reference it without TDZ errors (Vitest 4 idiom; copied from _four/TopNav.test.ts).
const { mockPage } = vi.hoisted(() => ({
  mockPage: {
    url: new URL('http://localhost/work'),
    route: { id: '/work' as string | null },
  },
}));
vi.mock('$app/state', () => ({ page: mockPage }));
vi.mock('$app/paths', () => ({ base: '' }));

import { mount, unmount } from 'svelte';
import FilterPillBar from './FilterPillBar.svelte';
import { getCategoriesInDisplayOrder, categoryToSlug } from '$lib/data';

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  mockPage.url = new URL('http://localhost/work');
  mockPage.route = { id: '/work' };
});

afterEach(() => {
  if (component) {
    unmount(component);
    component = undefined;
  }
  host?.remove();
});

function makeHost(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

function navEl(): HTMLElement {
  const n = host.querySelector('nav[aria-label="Filmography filters"]');
  if (!n) throw new Error('FilterPillBar nav landmark not found');
  return n as HTMLElement;
}

function anchors(): HTMLAnchorElement[] {
  return Array.from(navEl().querySelectorAll('a'));
}

describe('FilterPillBar — landmark + rendering (FILT-01, NAV-03)', () => {
  it('renders ONE <nav aria-label="Filmography filters">', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const navs = host.querySelectorAll('nav[aria-label="Filmography filters"]');
    expect(navs.length).toBe(1);
  });

  it('renders exactly 9 anchors (1 All + 8 categories)', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    expect(anchors().length).toBe(9);
  });

  it('first anchor is the All pill with href "/work" and label "All"', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const first = anchors()[0]!;
    expect(first.getAttribute('href')).toBe('/work');
    expect(first.textContent?.trim()).toBe('All');
  });

  it('PBS anchor href is /work/pbs-american-portrait (FILTER route, NOT /pbs-american-portrait/)', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const pbs = anchors().find((a) => a.textContent?.trim() === 'PBS American Portrait');
    expect(pbs).toBeDefined();
    expect(pbs?.getAttribute('href')).toBe('/work/pbs-american-portrait');
  });

  it('Reel anchor href is /work/reel', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const reel = anchors().find((a) => a.textContent?.trim() === 'Reel');
    expect(reel?.getAttribute('href')).toBe('/work/reel');
  });
});

describe('FilterPillBar — preload contract (D-15)', () => {
  it('every anchor carries data-sveltekit-preload-data="hover"', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const links = anchors();
    expect(links.length).toBe(9);
    for (const a of links) {
      expect(a.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    }
  });
});

describe('FilterPillBar — active state on /work (D-03 All pill)', () => {
  it('All pill className contains bg-neutral-50 (neutral-active token)', () => {
    mockPage.url = new URL('http://localhost/work');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const all = anchors()[0]!;
    expect(all.className).toMatch(/bg-neutral-50/);
    expect(all.getAttribute('aria-current')).toBe('page');
  });

  it('no category pill is active (no text-cat-* classes)', () => {
    mockPage.url = new URL('http://localhost/work');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const cats = anchors().slice(1);
    for (const a of cats) {
      expect(a.className).not.toMatch(/text-cat-/);
      expect(a.getAttribute('aria-current')).toBeNull();
    }
  });
});

describe('FilterPillBar — active state on /work/pbs-american-portrait (D-02)', () => {
  it('PBS pill className matches text-cat-pbs + bg-cat-pbs/15 + ring-cat-pbs/40', () => {
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const pbs = anchors().find((a) => a.textContent?.trim() === 'PBS American Portrait')!;
    expect(pbs.className).toMatch(/text-cat-pbs/);
    expect(pbs.className).toMatch(/bg-cat-pbs\/15/);
    expect(pbs.className).toMatch(/ring-cat-pbs\/40/);
  });

  it('PBS pill carries aria-current="page"', () => {
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const pbs = anchors().find((a) => a.textContent?.trim() === 'PBS American Portrait')!;
    expect(pbs.getAttribute('aria-current')).toBe('page');
  });

  it('All pill is inactive (no bg-neutral-50)', () => {
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const all = anchors()[0]!;
    expect(all.className).not.toMatch(/bg-neutral-50/);
    expect(all.getAttribute('aria-current')).toBeNull();
  });

  it('other 7 category pills are NOT active (no text-cat-* class)', () => {
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const others = anchors()
      .slice(1)
      .filter((a) => a.textContent?.trim() !== 'PBS American Portrait');
    for (const a of others) {
      expect(a.className).not.toMatch(/text-cat-/);
    }
  });
});

describe('FilterPillBar — trailing-slash normalization (endsWith helper)', () => {
  it('on /work/pbs-american-portrait/ (trailing slash), PBS pill is STILL active', () => {
    // _three has NOT yet set trailingSlash='always' in src/routes/+layout.ts (only prerender=true);
    // the endsWith normalization MUST handle both /work/<slug> and /work/<slug>/.
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait/');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const pbs = anchors().find((a) => a.textContent?.trim() === 'PBS American Portrait')!;
    expect(pbs.className).toMatch(/text-cat-pbs/);
    expect(pbs.getAttribute('aria-current')).toBe('page');
  });

  it('on /work/ (trailing slash), All pill is STILL active', () => {
    mockPage.url = new URL('http://localhost/work/');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const all = anchors()[0]!;
    expect(all.className).toMatch(/bg-neutral-50/);
    expect(all.getAttribute('aria-current')).toBe('page');
  });
});

describe('FilterPillBar — non-work routes (no pill active)', () => {
  it('on /about, zero anchors carry aria-current="page"', () => {
    mockPage.url = new URL('http://localhost/about');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const current = anchors().filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.length).toBe(0);
  });

  it('on /about, All pill className does NOT contain bg-neutral-50', () => {
    mockPage.url = new URL('http://localhost/about');
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const all = anchors()[0]!;
    expect(all.className).not.toMatch(/bg-neutral-50/);
  });
});

describe('FilterPillBar — order preservation (FILT-01 + getCategoriesInDisplayOrder)', () => {
  it('the 8 category pills follow getCategoriesInDisplayOrder() exactly (after the All pill)', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const labels = anchors()
      .slice(1)
      .map((a) => a.textContent?.trim() ?? '');
    expect(labels).toEqual(order as unknown as string[]);
  });

  it('PBS href slug matches categoryToSlug("PBS American Portrait")', () => {
    component = mount(FilterPillBar, { target: makeHost(), props: {} });
    const pbs = anchors().find((a) => a.textContent?.trim() === 'PBS American Portrait')!;
    expect(pbs.getAttribute('href')).toBe(`/work/${categoryToSlug('PBS American Portrait')}`);
  });
});
