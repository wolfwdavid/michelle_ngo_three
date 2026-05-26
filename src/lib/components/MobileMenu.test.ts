import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock $app/paths so the test doesn't depend on BASE_PATH being set.
vi.mock('$app/paths', () => ({ base: '' }));

import { flushSync, mount, unmount } from 'svelte';
import MobileMenu from './MobileMenu.svelte';
import { getCategoriesInDisplayOrder } from '$lib/data';
import {
  __resetMenuStateForTests,
  menu,
  openMenu,
} from '$lib/state/menu.svelte';

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  __resetMenuStateForTests();
  // MobileMenu is mounted by TopNav AFTER openMenu() has been called; mirror that
  // state shape so closeMenu()'s "flip to false" transition is observable.
  openMenu();
});

afterEach(() => {
  if (component) {
    unmount(component);
    component = undefined;
  }
  host?.remove();
  __resetMenuStateForTests();
});

function makeHost(): HTMLElement {
  host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

describe('MobileMenu — D-07 rendering', () => {
  it('renders <div role="dialog" aria-modal="true">', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    const dialog = host.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
  });

  it('renders 8 category links (one per getCategoriesInDisplayOrder() entry)', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const linkTexts = Array.from(host.querySelectorAll('a'))
      .map((a) => a.textContent?.trim() ?? '')
      .filter((t) => order.includes(t as (typeof order)[number]));
    expect(linkTexts).toEqual(order);
  });

  it('renders About / Press / Contact secondary links', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    const texts = Array.from(host.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(texts).toContain('About');
    expect(texts).toContain('Press');
    expect(texts).toContain('Contact');
  });

  it('every category link has data-sveltekit-preload-data="hover" (D-15)', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    const order = getCategoriesInDisplayOrder();
    const categoryLinks = Array.from(host.querySelectorAll('a')).filter((a) =>
      order.includes((a.textContent?.trim() ?? '') as (typeof order)[number])
    );
    for (const link of categoryLinks) {
      expect(link.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    }
  });

  it('every secondary link has data-sveltekit-preload-data="hover" (D-15)', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    const secondaryTexts = ['About', 'Press', 'Contact'];
    for (const t of secondaryTexts) {
      const link = Array.from(host.querySelectorAll('a')).find((a) => a.textContent?.trim() === t);
      expect(link?.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    }
  });
});

describe('MobileMenu — D-07 close interactions', () => {
  it('clicking the close button fires closeMenu (menu.menuOpen → false)', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    expect(menu.menuOpen).toBe(true);
    const closeBtn = host.querySelector(
      'button[aria-label="Close menu"]'
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    flushSync();
    expect(menu.menuOpen).toBe(false);
  });

  it('clicking a category link fires closeMenu', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    expect(menu.menuOpen).toBe(true);
    // Click the first category link (the one inside the dialog's category <ul>).
    const order = getCategoriesInDisplayOrder();
    const firstCategoryLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === order[0]
    ) as HTMLAnchorElement | undefined;
    expect(firstCategoryLink).toBeTruthy();
    // Use preventDefault wrapper to suppress actual navigation in jsdom.
    firstCategoryLink?.addEventListener('click', (e) => e.preventDefault(), { once: true });
    firstCategoryLink?.click();
    flushSync();
    expect(menu.menuOpen).toBe(false);
  });
});

describe('MobileMenu — D-12 Escape close', () => {
  it('pressing Escape (document keydown) fires closeMenu', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    flushSync(); // ensure $effect has subscribed the keydown listener
    expect(menu.menuOpen).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    flushSync();
    expect(menu.menuOpen).toBe(false);
  });

  it('pressing a non-Escape key does NOT fire closeMenu', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    flushSync();
    expect(menu.menuOpen).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    flushSync();
    expect(menu.menuOpen).toBe(true);
  });

  it('keydown listener is removed on unmount (Escape after unmount is no-op)', () => {
    component = mount(MobileMenu, { target: makeHost(), props: {} });
    flushSync();
    expect(menu.menuOpen).toBe(true);
    if (component) {
      unmount(component);
      component = undefined;
    }
    flushSync();
    // Re-open via direct rune call to verify Escape no longer fires the closure.
    openMenu();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    flushSync();
    // The unmounted listener should NOT have fired closeMenu, so menuOpen stays true.
    expect(menu.menuOpen).toBe(true);
  });
});
