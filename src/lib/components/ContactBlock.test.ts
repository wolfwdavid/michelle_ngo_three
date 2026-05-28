import { afterEach, describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import ContactBlock from './ContactBlock.svelte';

let host: HTMLElement;
let component: ReturnType<typeof mount> | undefined;

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

describe('ContactBlock — D-20 / D-21 channel rendering', () => {
  it('renders exactly 5 channel rows', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const items = Array.from(host.querySelectorAll('li'));
    expect(items.length).toBe(5);
  });

  it('renders channels in D-20 order: Email → Phone → IMDb → LinkedIn → Vimeo', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const linkTexts = Array.from(host.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(linkTexts).toEqual(['mynogo@gmail.com', '(917) 566-1976', 'IMDb', 'LinkedIn', 'Vimeo']);
  });
});

describe('ContactBlock — D-20 email + phone', () => {
  it('email link has mailto:mynogo@gmail.com and text mynogo@gmail.com', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const emailLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === 'mailto:mynogo@gmail.com'
    );
    expect(emailLink, 'mailto: link not found').toBeDefined();
    expect(emailLink?.textContent?.trim()).toBe('mynogo@gmail.com');
  });

  it('phone link has tel:+19175661976 and display text (917) 566-1976 with parens + dash', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const phoneLink = Array.from(host.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === 'tel:+19175661976'
    );
    expect(phoneLink, 'tel: link not found').toBeDefined();
    expect(phoneLink?.textContent?.trim()).toBe('(917) 566-1976');
  });
});

describe('ContactBlock — D-21 socials (target=_blank rel=noopener)', () => {
  it('IMDb link is external (target=_blank rel=noopener), points to imdb.com, text "IMDb"', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const imdb = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'IMDb'
    );
    expect(imdb, 'IMDb link not found').toBeDefined();
    expect(imdb?.getAttribute('target')).toBe('_blank');
    expect(imdb?.getAttribute('rel')).toBe('noopener');
    expect(imdb?.getAttribute('href') ?? '').toContain('imdb.com');
  });

  it('LinkedIn link is external (target=_blank rel=noopener), points to linkedin.com, text "LinkedIn"', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const linkedin = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'LinkedIn'
    );
    expect(linkedin, 'LinkedIn link not found').toBeDefined();
    expect(linkedin?.getAttribute('target')).toBe('_blank');
    expect(linkedin?.getAttribute('rel')).toBe('noopener');
    expect(linkedin?.getAttribute('href') ?? '').toContain('linkedin.com');
  });

  it('Vimeo link is external (target=_blank rel=noopener), points to vimeo.com, text "Vimeo"', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const vimeo = Array.from(host.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Vimeo'
    );
    expect(vimeo, 'Vimeo link not found').toBeDefined();
    expect(vimeo?.getAttribute('target')).toBe('_blank');
    expect(vimeo?.getAttribute('rel')).toBe('noopener');
    expect(vimeo?.getAttribute('href') ?? '').toContain('vimeo.com');
  });
});

describe('ContactBlock — Phase 3 D-08 inline-link style', () => {
  it('every link has text-white hover:underline underline-offset-2 utility classes', () => {
    component = mount(ContactBlock, { target: makeHost(), props: {} });
    const links = Array.from(host.querySelectorAll('a'));
    expect(links.length).toBe(5);
    for (const a of links) {
      expect(a.className).toContain('text-white');
      expect(a.className).toContain('hover:underline');
      expect(a.className).toContain('underline-offset-2');
    }
  });
});
