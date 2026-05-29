import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock $app/state + $app/paths BEFORE Footer import (Phase 5 pattern, mirrors _four).
const { mockPageFooter } = vi.hoisted(() => ({
  mockPageFooter: {
    url: new URL('http://localhost/'),
    route: { id: '/' as string | null },
  },
}));
vi.mock('$app/state', () => ({ page: mockPageFooter }));
vi.mock('$app/paths', () => ({ base: '' }));

import { mount, unmount } from 'svelte';
import Footer from './Footer.svelte';
import { getCategoriesInDisplayOrder } from '$lib/data';

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  mockPageFooter.url = new URL('http://localhost/');
  mockPageFooter.route = { id: '/' };
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

describe('Footer — D-15 chrome contract', () => {
  it('renders root <footer> with hairline border + neutral-950 bg + py-12 md:py-16', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const footer = host.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.className).toContain('border-t');
    expect(footer?.className).toContain('border-white/10');
    expect(footer?.className).toContain('bg-neutral-950');
    expect(footer?.className).toContain('py-12');
    expect(footer?.className).toContain('md:py-16');
  });

  it('renders inner grid with grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 (D-13)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const grid = Array.from(host.querySelectorAll('div')).find((d) =>
      d.className.includes('grid-cols-1')
    );
    expect(grid, 'grid container not found').toBeDefined();
    expect(grid?.className).toContain('grid');
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
    expect(grid?.className).toContain('gap-8');
    expect(grid?.className).toContain('lg:gap-12');
  });
});

describe('Footer — D-13 3-column structure', () => {
  it('renders three columns in order: contact / work / site', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const cols = Array.from(host.querySelectorAll('[data-footer-col]')).map((el) =>
      el.getAttribute('data-footer-col')
    );
    expect(cols).toEqual(['contact', 'work', 'site']);
  });
});

describe('Footer — D-13 column 1 ContactBlock', () => {
  it('column 1 has data-footer-col="contact" and renders 5 ContactBlock li rows', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col1 = host.querySelector('[data-footer-col="contact"]');
    expect(col1).not.toBeNull();
    const items = col1?.querySelectorAll('li') ?? [];
    expect(items.length).toBe(5);
  });

  it('column 1 channel rows render in D-20 order (Email → Phone → IMDb → LinkedIn → Vimeo)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col1 = host.querySelector('[data-footer-col="contact"]');
    const linkTexts = Array.from(col1?.querySelectorAll('a') ?? []).map((a) =>
      a.textContent?.trim()
    );
    expect(linkTexts).toEqual(['mynogo@gmail.com', '(917) 566-1976', 'IMDb', 'LinkedIn', 'Vimeo']);
  });

  it('column 1 renders header textContent "Contact"', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col1 = host.querySelector('[data-footer-col="contact"]');
    const header = col1?.querySelector('h2');
    expect(header?.textContent?.trim()).toBe('Contact');
  });
});

describe('Footer — D-13 column 2 categories (PBS retarget)', () => {
  it('column 2 renders 8 category links in getCategoriesInDisplayOrder() order', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col2 = host.querySelector('[data-footer-col="work"]');
    expect(col2).not.toBeNull();
    const order = getCategoriesInDisplayOrder();
    const linkTexts = Array.from(col2?.querySelectorAll('a') ?? []).map(
      (a) => a.textContent?.trim() ?? ''
    );
    expect(linkTexts).toEqual(Array.from(order));
  });

  it('PBS link href ends with /pbs-american-portrait/ (trailing slash per D-13)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col2 = host.querySelector('[data-footer-col="work"]');
    const pbsLink = Array.from(col2?.querySelectorAll('a') ?? []).find(
      (a) => a.textContent?.trim() === 'PBS American Portrait'
    );
    expect(pbsLink?.getAttribute('href') ?? '').toMatch(/\/pbs-american-portrait\/$/);
  });

  it('non-PBS category links use /work/<slug> form (matches TopNav verbatim, D-13)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col2 = host.querySelector('[data-footer-col="work"]');
    const reelLink = Array.from(col2?.querySelectorAll('a') ?? []).find(
      (a) => a.textContent?.trim() === 'Reel'
    );
    expect(reelLink?.getAttribute('href')).toBe('/work/reel');
  });

  it('column 2 category links carry NO per-category accent class (D-14 mono)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col2 = host.querySelector('[data-footer-col="work"]');
    const links = Array.from(col2?.querySelectorAll('a') ?? []);
    for (const a of links) {
      expect(a.className).not.toMatch(/text-cat-/);
    }
  });

  it('column 2 renders header textContent "Work"', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col2 = host.querySelector('[data-footer-col="work"]');
    const header = col2?.querySelector('h2');
    expect(header?.textContent?.trim()).toBe('Work');
  });
});

describe('Footer — D-13 column 3 site links', () => {
  it('column 3 renders 4 links in order: About, Press, Contact, View All Work →', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col3 = host.querySelector('[data-footer-col="site"]');
    expect(col3).not.toBeNull();
    const linkTexts = Array.from(col3?.querySelectorAll('a') ?? []).map((a) =>
      a.textContent?.trim()
    );
    expect(linkTexts).toEqual(['About', 'Press', 'Contact', 'View All Work →']);
  });

  it('column 3 hrefs are /about, /press, /contact, /work (View All Work → uses /work, no trailing slash, _four D-29 verbatim)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col3 = host.querySelector('[data-footer-col="site"]');
    const hrefs = Array.from(col3?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/about', '/press', '/contact', '/work']);
  });

  it('column 3 renders header textContent "Site"', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col3 = host.querySelector('[data-footer-col="site"]');
    const header = col3?.querySelector('h2');
    expect(header?.textContent?.trim()).toBe('Site');
  });
});

describe('Footer — D-13 / _four D-29 bottom strip', () => {
  it('renders literal copyright "© 2026 Michelle Ngo · Built with SvelteKit"', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const text = host.textContent ?? '';
    expect(text).toContain('© 2026 Michelle Ngo');
    expect(text).toContain('Built with SvelteKit');
  });

  it('bottom strip has hairline top border (border-t border-white/10)', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const strips = Array.from(host.querySelectorAll('div')).filter(
      (d) => d.className.includes('border-t') && d.className.includes('border-white/10')
    );
    const stripWithCopy = strips.find((s) => (s.textContent ?? '').includes('© 2026'));
    expect(stripWithCopy, 'bottom strip with copyright not found').toBeDefined();
  });
});

describe('Footer — prefetch on internal links', () => {
  it('every internal link in columns 2 + 3 has data-sveltekit-preload-data="hover"', () => {
    component = mount(Footer, { target: makeHost(), props: {} });
    const col2 = host.querySelector('[data-footer-col="work"]');
    const col3 = host.querySelector('[data-footer-col="site"]');
    const links = [
      ...Array.from(col2?.querySelectorAll('a') ?? []),
      ...Array.from(col3?.querySelectorAll('a') ?? []),
    ];
    expect(links.length).toBe(12); // 8 categories + 4 site links
    for (const a of links) {
      expect(a.getAttribute('data-sveltekit-preload-data')).toBe('hover');
    }
  });
});
