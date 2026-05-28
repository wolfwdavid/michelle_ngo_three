import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { producerReelId } from '$lib/data';

/**
 * `/contact/+page.svelte` — Phase 6 Plan 06-03. CONT-01 (home) + CONT-02.
 *
 * Tests:
 *   1. <head><title> contains "Contact — Michelle Ngo"
 *   2. poster bg <img> src contains producer-reel poster + alt=""
 *   3. sr-only landmark <h1 class="sr-only">Contact Michelle Ngo</h1>
 *   4. visible "MICHELLE NGO" wordmark
 *   5. ContactBlock rendered (5 channel links)
 *   6. ↓ scroll-cue with aria-hidden="true"
 *   7. two-stop gradient overlay (linear-gradient + rgba(0,0,0,0.55))
 *   8. outer splash <section> has h-svh
 *   9. ZERO <iframe> elements (D-11 static poster only)
 */
vi.mock('$app/paths', () => ({ base: '' }));

import Page from './+page.svelte';

beforeEach(() => {});
afterEach(() => {
  vi.restoreAllMocks();
  document.head.querySelectorAll('title').forEach((el) => el.remove());
});

describe('/contact/+page.svelte — splash composition', () => {
  test('<title> contains "Contact — Michelle Ngo"', () => {
    render(Page);
    const title = document.head.querySelector('title');
    expect(title?.textContent ?? '').toContain('Contact — Michelle Ngo');
  });

  test('poster bg <img> uses the producer-reel poster with alt=""', () => {
    const { container } = render(Page);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src') ?? '').toContain(producerReelId);
    expect(img?.getAttribute('src') ?? '').toContain('posters/');
    expect(img?.getAttribute('alt')).toBe('');
  });

  test('renders sr-only landmark <h1 class="sr-only">Contact Michelle Ngo</h1>', () => {
    const { container } = render(Page);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.className).toContain('sr-only');
    expect(h1?.textContent?.trim()).toBe('Contact Michelle Ngo');
  });

  test('renders the visible "MICHELLE NGO" wordmark', () => {
    const { container } = render(Page);
    const wordmark = Array.from(container.querySelectorAll('p')).find(
      (p) => p.textContent?.trim() === 'MICHELLE NGO'
    );
    expect(wordmark).toBeDefined();
    expect(wordmark?.className).toContain('font-display');
    expect(wordmark?.className).toContain('text-6xl');
  });

  test('renders ContactBlock with 5 channel links', () => {
    const { container } = render(Page);
    expect(container.querySelector('a[href="mailto:mynogo@gmail.com"]')).not.toBeNull();
    expect(container.querySelector('a[href="tel:+19175661976"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://www.imdb.com/"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://www.linkedin.com/"]')).not.toBeNull();
    expect(container.querySelector('a[href="https://vimeo.com/user2149742"]')).not.toBeNull();
  });

  test('renders ↓ scroll-cue with aria-hidden="true"', () => {
    const { container } = render(Page);
    const cue = Array.from(container.querySelectorAll('[aria-hidden="true"]')).find((el) =>
      el.textContent?.includes('↓')
    );
    expect(cue).toBeDefined();
  });

  test('renders the two-stop gradient overlay (D-11 canonical stops)', () => {
    const { container } = render(Page);
    const gradient = Array.from(container.querySelectorAll('div[style*="linear-gradient"]'));
    expect(gradient.length).toBeGreaterThanOrEqual(1);
    const style = gradient[0]?.getAttribute('style') ?? '';
    expect(style).toContain('linear-gradient');
    expect(style).toContain('rgba(0,0,0,0.55)');
  });

  test('outer splash <section> uses h-svh (POL-03 viewport lock)', () => {
    const { container } = render(Page);
    const section = container.querySelector('section');
    expect(section?.className).toContain('h-svh');
  });

  test('renders ZERO <iframe> elements (D-11 static poster only)', () => {
    const { container } = render(Page);
    expect(container.querySelectorAll('iframe').length).toBe(0);
  });
});
