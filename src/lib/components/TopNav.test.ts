import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock $app/state's `page` rune-style export BEFORE importing TopNav.
// Tests overwrite mockPage.url + mockPage.route per-test to simulate route changes.
const { mockPage } = vi.hoisted(() => ({
  mockPage: {
    url: new URL('http://localhost/'),
    route: { id: '/' as string | null },
  },
}));
vi.mock('$app/state', () => ({ page: mockPage }));
vi.mock('$app/paths', () => ({ base: '' }));

import { flushSync, mount, unmount } from 'svelte';
import TopNav from './TopNav.svelte';
import { getCategoriesInDisplayOrder } from '$lib/data';
import {
  __resetScrollIdleForTests,
  initScrollIdle,
  SCROLL_STOP_DEBOUNCE_MS,
} from '$lib/state/scrollIdle.svelte';
import {
  __resetMenuStateForTests,
  menu,
  closeMenu,
} from '$lib/state/menu.svelte';

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  mockPage.url = new URL('http://localhost/');
  mockPage.route = { id: '/' };
  __resetScrollIdleForTests();
  __resetMenuStateForTests();
});

afterEach(() => {
  if (component) {
    unmount(component);
    component = undefined;
  }
  host?.remove();
  __resetScrollIdleForTests();
  __resetMenuStateForTests();
  vi.useRealTimers();
});

function makeHost(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

describe('TopNav — NAV-01 baseline rendering', () => {
  it('renders the MICHELLE NGO wordmark linking to /', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const wordmark = host.querySelector('header a');
    expect(wordmark?.textContent?.toLowerCase()).toContain('michelle ngo');
  });

  it('renders all 8 category links in getCategoriesInDisplayOrder() order', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const linkTexts = Array.from(host.querySelectorAll('a'))
      .map((a) => a.textContent?.trim() ?? '')
      .filter((t) => order.includes(t as (typeof order)[number]));
    expect(linkTexts).toEqual(order);
  });

  it('renders About / Press / Contact secondary links', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const texts = Array.from(host.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(texts).toContain('About');
    expect(texts).toContain('Press');
    expect(texts).toContain('Contact');
  });

  it('every category link has data-sveltekit-preload-data="hover" (D-15)', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const categoryLinks = Array.from(host.querySelectorAll('a')).filter((a) =>
      order.includes((a.textContent?.trim() ?? '') as (typeof order)[number])
    );
    expect(categoryLinks.length).toBe(8);
    for (const link of categoryLinks) {
      expect(link.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    }
  });

  it('About / Press / Contact secondary links have data-sveltekit-preload-data="hover" (D-15)', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const secondaryTexts = ['About', 'Press', 'Contact'];
    for (const t of secondaryTexts) {
      const link = Array.from(host.querySelectorAll('a')).find((a) => a.textContent?.trim() === t);
      expect(link).toBeTruthy();
      expect(link?.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    }
  });

  it('hamburger button has aria-label="Open menu" and aria-expanded=false when menu closed', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const button = host.querySelector('button[aria-label="Open menu"]');
    expect(button).toBeTruthy();
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('TopNav is wrapped in <nav aria-label="Main navigation">', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const nav = host.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).toBeTruthy();
  });
});

describe('TopNav — PBS dual-route active-state (NAV-01 / PBS-03)', () => {
  it('on /work/pbs-american-portrait/ (with trailing slash), PBS link gets cat-pbs accent', () => {
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait/');
    mockPage.route = { id: '/work/[category]' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    const pbsLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'PBS American Portrait'
    );
    expect(pbsLink?.className).toMatch(/text-cat-pbs/);
  });

  it('on /work/pbs-american-portrait (no trailing slash), PBS link STILL gets cat-pbs accent', () => {
    mockPage.url = new URL('http://localhost/work/pbs-american-portrait');
    mockPage.route = { id: '/work/[category]' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    const pbsLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'PBS American Portrait'
    );
    expect(pbsLink?.className).toMatch(/text-cat-pbs/);
  });

  it('on /pbs-american-portrait/ (Phase 6 future landing), PBS link gets cat-pbs accent (PBS-03 dual-route guard)', () => {
    mockPage.url = new URL('http://localhost/pbs-american-portrait/');
    mockPage.route = { id: '/pbs-american-portrait' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    const pbsLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'PBS American Portrait'
    );
    expect(pbsLink?.className).toMatch(/text-cat-pbs/);
  });

  it('on /work (no filter), no category link is highlighted', () => {
    mockPage.url = new URL('http://localhost/work');
    mockPage.route = { id: '/work' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const highlighted = Array.from(host.querySelectorAll('a'))
      .filter((a) => order.includes((a.textContent?.trim() ?? '') as (typeof order)[number]))
      .filter((a) => /text-cat-/.test(a.className));
    expect(highlighted.length).toBe(0);
  });

  it('on /watch/<id>, no category link is highlighted', () => {
    mockPage.url = new URL('http://localhost/watch/264677021');
    mockPage.route = { id: '/watch/[id]' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const highlighted = Array.from(host.querySelectorAll('a'))
      .filter((a) => order.includes((a.textContent?.trim() ?? '') as (typeof order)[number]))
      .filter((a) => /text-cat-/.test(a.className));
    expect(highlighted.length).toBe(0);
  });

  it('on /pbs-american-portrait/, OTHER 7 categories are NOT highlighted (only PBS)', () => {
    mockPage.url = new URL('http://localhost/pbs-american-portrait/');
    mockPage.route = { id: '/pbs-american-portrait' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const highlighted = Array.from(host.querySelectorAll('a'))
      .filter((a) => order.includes((a.textContent?.trim() ?? '') as (typeof order)[number]))
      .filter((a) => /text-cat-/.test(a.className))
      .map((a) => a.textContent?.trim());
    expect(highlighted).toEqual(['PBS American Portrait']);
  });
});

describe('TopNav — D-05 chrome-fade on reel routes', () => {
  it('on /work with scrollIdle.isScrolling=true, <header> contains opacity-0 + pointer-events-none', () => {
    mockPage.url = new URL('http://localhost/work');
    mockPage.route = { id: '/work' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    flushSync(); // ensure $effect has subscribed the scroll listener
    // Fire a scroll event to flip isScrolling=true.
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    const header = host.querySelector('header');
    expect(header?.className).toMatch(/opacity-0/);
    expect(header?.className).toMatch(/pointer-events-none/);
  });

  it('on /work with hover-near-top (clientY < 80), chrome surfaces (no opacity-0)', () => {
    mockPage.url = new URL('http://localhost/work');
    mockPage.route = { id: '/work' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    flushSync();
    // Trigger scrolling THEN hover-near-top.
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    document.dispatchEvent(new PointerEvent('pointermove', { clientY: 40 }));
    flushSync();
    const header = host.querySelector('header');
    expect(header?.className).not.toMatch(/opacity-0/);
  });

  it('on /work after scroll-stop debounce, chrome surfaces back to solid', () => {
    vi.useFakeTimers();
    mockPage.url = new URL('http://localhost/work');
    mockPage.route = { id: '/work' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    flushSync();
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    let header = host.querySelector('header');
    expect(header?.className).toMatch(/opacity-0/);
    // Advance past the debounce window — isScrolling flips back to false.
    vi.advanceTimersByTime(SCROLL_STOP_DEBOUNCE_MS + 50);
    flushSync();
    header = host.querySelector('header');
    expect(header?.className).not.toMatch(/opacity-0/);
  });

  it('on /work after tap (pointerdown), chrome surfaces for 800ms even while scrolling', () => {
    mockPage.url = new URL('http://localhost/work');
    mockPage.route = { id: '/work' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    flushSync();
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    document.dispatchEvent(new PointerEvent('pointerdown'));
    flushSync();
    const header = host.querySelector('header');
    expect(header?.className).not.toMatch(/opacity-0/);
  });
});

describe('TopNav — D-06 chrome stays solid on non-reel routes', () => {
  it('on / (splash), <header> NEVER contains opacity-0 even when scrolling', () => {
    mockPage.url = new URL('http://localhost/');
    mockPage.route = { id: '/' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    // Force scrollIdle.isScrolling=true via direct rune init then scroll event.
    initScrollIdle(window);
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    const header = host.querySelector('header');
    expect(header?.className).not.toMatch(/opacity-0/);
  });

  it('on /about, <header> stays solid', () => {
    mockPage.url = new URL('http://localhost/about');
    mockPage.route = { id: '/about' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    initScrollIdle(window);
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    const header = host.querySelector('header');
    expect(header?.className).not.toMatch(/opacity-0/);
  });

  it('on /watch/[id], <header> stays solid', () => {
    mockPage.url = new URL('http://localhost/watch/264677021');
    mockPage.route = { id: '/watch/[id]' };
    component = mount(TopNav, { target: makeHost(), props: {} });
    initScrollIdle(window);
    window.dispatchEvent(new Event('scroll'));
    flushSync();
    const header = host.querySelector('header');
    expect(header?.className).not.toMatch(/opacity-0/);
  });
});

describe('TopNav — mobile menu interaction (D-07 + D-08)', () => {
  it('clicking the hamburger opens MobileMenu (menu.menuOpen flips to true)', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const button = host.querySelector('button[aria-label="Open menu"]') as HTMLButtonElement;
    expect(menu.menuOpen).toBe(false);
    button.click();
    flushSync();
    expect(menu.menuOpen).toBe(true);
    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
  });

  it('hamburger button aria-expanded reflects menu.menuOpen after click', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const button = host.querySelector('button[aria-label="Open menu"]') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    flushSync();
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('closing the menu (via closeMenu) removes MobileMenu from DOM', () => {
    component = mount(TopNav, { target: makeHost(), props: {} });
    const button = host.querySelector('button[aria-label="Open menu"]') as HTMLButtonElement;
    button.click();
    flushSync();
    expect(host.querySelector('[role="dialog"]')).toBeTruthy();
    closeMenu();
    flushSync();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });
});
