import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';

/**
 * `/about/+page.svelte` — Phase 6 Plan 06-03. ABT-01 + CONT-01 (partial).
 *
 * Tests:
 *   1. <head><title> contains "About — Michelle Ngo"
 *   2. HeroAmbient Act 1 renders an <h1> with textContent "ABOUT" (wordmark prop)
 *   3. Act 1 has NO "Filmmaker & Producer" tagline (suppressed via tagline={undefined})
 *   4. sr-only landmark <h1 class="sr-only">About Michelle Ngo</h1>
 *   5. Bio paragraph verbatim (first + last sentence substrings)
 *   6. ContactBlock rendered (5 channel links)
 *   7. ContactBlock wrapper has mt-12 (D-10)
 *   8. Person JSON-LD in <head> with @type Person + name + sameAs[3]
 *   9. JSON-LD sameAs URLs contain imdb.com / linkedin.com / vimeo.com (D-21)
 *
 * HeroAmbient pulls in module-scope runes (motion/network/visibility) + a
 * deferred PreviewLoop; we mock $app/paths for stable hrefs and let the real
 * HeroAmbient mount (its own defer never fires the iframe synchronously, so no
 * extra teardown needed for these static-composition assertions).
 */
vi.mock('$app/paths', () => ({ base: '' }));

import Page from './+page.svelte';

beforeEach(() => {});
afterEach(() => {
  vi.restoreAllMocks();
  // Clean any JSON-LD the previous render injected into the shared test <head>.
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
  document.head.querySelectorAll('title').forEach((el) => el.remove());
});

describe('/about/+page.svelte — Act 1 (HeroAmbient)', () => {
  test('renders an <h1> with textContent "ABOUT" (HeroAmbient wordmark prop)', () => {
    const { container } = render(Page);
    const h1s = Array.from(container.querySelectorAll('h1'));
    const aboutWordmark = h1s.find((h) => h.textContent?.trim() === 'ABOUT');
    expect(aboutWordmark).toBeDefined();
  });

  test('Act 1 has NO "Filmmaker & Producer" tagline (suppressed)', () => {
    const { container } = render(Page);
    expect(container.textContent ?? '').not.toContain('Filmmaker & Producer');
  });
});

describe('/about/+page.svelte — Act 2 (bio + ContactBlock)', () => {
  test('renders sr-only landmark <h1 class="sr-only">About Michelle Ngo</h1>', () => {
    const { container } = render(Page);
    const h1s = Array.from(container.querySelectorAll('h1'));
    const srOnly = h1s.find(
      (h) => h.className.includes('sr-only') && h.textContent?.trim() === 'About Michelle Ngo'
    );
    expect(srOnly).toBeDefined();
  });

  test('bio paragraph contains the verbatim approved first + last sentences', () => {
    const { container } = render(Page);
    const text = (container.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain("I'm Michelle Ngo, a filmmaker and producer based in New York City");
    expect(text).toContain(
      'If you have a project that needs a steady hand and a quick turn, get in touch.'
    );
  });

  test('renders ContactBlock with 5 channel links', () => {
    const { container } = render(Page);
    expect(container.querySelector('a[href="mailto:mynogo@gmail.com"]')).not.toBeNull();
    expect(container.querySelector('a[href="tel:+19175661976"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://www.imdb.com/"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://www.linkedin.com/"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://vimeo.com/user2149742"]')).not.toBeNull();
  });

  test('ContactBlock wrapper has mt-12 spacing (D-10)', () => {
    const { container } = render(Page);
    // The mailto anchor is inside the ContactBlock <ul>; walk up to the mt-12 wrapper div.
    const mailto = container.querySelector('a[href="mailto:mynogo@gmail.com"]');
    expect(mailto).not.toBeNull();
    const wrapper = mailto?.closest('div.mt-12');
    expect(wrapper).not.toBeNull();
  });
});

describe('/about/+page.svelte — SEO + Person JSON-LD', () => {
  test('<title> contains "About — Michelle Ngo"', () => {
    render(Page);
    const title = document.head.querySelector('title');
    expect(title?.textContent ?? '').toContain('About — Michelle Ngo');
  });

  test('Person JSON-LD parses with @type Person, name, sameAs[3]', () => {
    render(Page);
    const ldScript = document.head.querySelector('script[type="application/ld+json"]');
    expect(ldScript).toBeTruthy();
    const ld = JSON.parse(ldScript?.textContent ?? '{}');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Michelle Ngo');
    expect(Array.isArray(ld.sameAs)).toBe(true);
    expect(ld.sameAs).toHaveLength(3);
  });

  test('JSON-LD sameAs URLs match ContactBlock channel domains (D-21)', () => {
    render(Page);
    const ldScript = document.head.querySelector('script[type="application/ld+json"]');
    const ld = JSON.parse(ldScript?.textContent ?? '{}');
    const joined = (ld.sameAs as string[]).join(' ');
    expect(joined).toContain('imdb.com');
    expect(joined).toContain('linkedin.com');
    expect(joined).toContain('vimeo.com');
  });
});
