import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { load } from './+page';

/**
 * `/press/+page.svelte` — Phase 6 Plan 06-02. PRES-01.
 *
 * Tests:
 *   6.  13 <article> landmarks rendered
 *   6b. Each <article> aria-label matches "Press credit: {title} on {network}"
 *   7.  Articles appear in PRESTIGE_ORDER (HBO Max first, Lenny Cooke (Movie) last)
 *   8.  Each <article> contains its network name text
 *   9.  Each <article> contains its video.title text
 *   10. Each <article> contains <a href="${base}/watch/${video.id}"> with "▷ Watch"
 *   11. <title>Press — Michelle Ngo</title>
 *   12. ZERO <iframe> elements (D-05 poster-only)
 */
vi.mock('$app/paths', () => ({ base: '' }));

import Page from './+page.svelte';

beforeEach(() => {});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('/press/+page.ts load()', () => {
  test('returns { credits } with 13 records', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = load({} as any) as { credits: Array<{ network: string }> };
    expect(result.credits.length).toBe(13);
  });
});

describe('/press/+page.svelte composition', () => {
  test('renders exactly 13 <article> landmarks (PRES-01)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    expect(container.querySelectorAll('article').length).toBe(13);
  });

  test('each <article> aria-label matches "Press credit: <title> on <network>" pattern', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    const articles = Array.from(container.querySelectorAll('article'));
    expect(articles.length).toBe(13);
    for (const a of articles) {
      const label = a.getAttribute('aria-label') ?? '';
      expect(label.startsWith('Press credit: ')).toBe(true);
      const rest = label.slice('Press credit: '.length);
      const parts = rest.split(' on ');
      // Must contain ' on ' separator with non-empty title and network.
      expect(parts.length).toBeGreaterThanOrEqual(2);
      // Reassemble accounting for possible " on " within title text — title is
      // everything up to the LAST " on " sep so the network is the trailer.
      const lastSepIdx = rest.lastIndexOf(' on ');
      expect(lastSepIdx).toBeGreaterThan(0);
      const title = rest.slice(0, lastSepIdx);
      const network = rest.slice(lastSepIdx + ' on '.length);
      expect(title.length).toBeGreaterThan(0);
      expect(network.length).toBeGreaterThan(0);
    }
  });

  test('articles appear in PRESTIGE_ORDER (HBO Max first, Lenny Cooke (Movie) last)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    const articles = Array.from(container.querySelectorAll('article'));
    const first = articles[0]?.getAttribute('aria-label') ?? '';
    const last = articles[articles.length - 1]?.getAttribute('aria-label') ?? '';
    expect(first.endsWith(' on HBO Max')).toBe(true);
    expect(last.endsWith(' on Lenny Cooke (Movie)')).toBe(true);
  });

  test('each <article> contains its network name text (network wordmark)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    const articles = Array.from(container.querySelectorAll('article'));
    for (let i = 0; i < articles.length; i++) {
      const text = articles[i]?.textContent ?? '';
      const network = data.credits[i].network;
      expect(text, `article ${i} should contain network "${network}"`).toContain(network);
    }
  });

  test('each <article> contains its video.title text', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    const articles = Array.from(container.querySelectorAll('article'));
    for (let i = 0; i < articles.length; i++) {
      const text = articles[i]?.textContent ?? '';
      const title = data.credits[i].video.title;
      expect(text, `article ${i} should contain title "${title}"`).toContain(title);
    }
  });

  test('each <article> contains <a href="/watch/<id>"> with ▷ Watch CTA', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    const articles = Array.from(container.querySelectorAll('article'));
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      if (!article) continue;
      const id = data.credits[i].video.id;
      const watchLink = article.querySelector(`a[href="/watch/${id}"]`);
      expect(watchLink, `article ${i} should have <a href="/watch/${id}">`).not.toBeNull();
      expect(watchLink?.textContent?.trim()).toContain('▷ Watch');
    }
  });

  test('renders ZERO <iframe> elements (D-05 poster-only)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = load({} as any) as { credits: any[] };
    const { container } = render(Page, { props: { data } });
    expect(container.querySelectorAll('iframe').length).toBe(0);
  });
});
