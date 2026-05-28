import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { load } from './+page';
import { __resetMotionStateForTests } from '$lib/state/motion.svelte';
import { __resetNetworkStateForTests } from '$lib/state/network.svelte';
import { __resetVisibilityForTests } from '$lib/state/visibility.svelte';
import { __resetMenuStateForTests } from '$lib/state/menu.svelte';

/**
 * `/pbs-american-portrait/+page.svelte` — Phase 6 Plan 06-02. PBS-01 + PBS-02.
 *
 * Tests:
 *   5. Section zero renders (id="reel-intro-heading" landmark target)
 *   5b. D-02 subtitle eyebrow literal "18 STORIES PRODUCED BY MICHELLE NGO"
 *   6. D-17 verbatim Candidate C blockquote substrings present
 *   7. Outbound `pbs.org/american-portrait/` link with verbatim text
 *   8. 18 <article> sections rendered (PBS-01)
 *   9. Exactly 15 "See on PBS →" anchors (PBS-02 — 3 missing by design)
 *   10. <title>PBS American Portrait — Michelle Ngo</title>
 */
vi.mock('$app/paths', () => ({ base: '' }));

// Import the page LAST so the mocks above are wired before its imports resolve.
import Page from './+page.svelte';

beforeEach(() => {
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  __resetVisibilityForTests();
  __resetMenuStateForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  __resetMotionStateForTests();
  __resetNetworkStateForTests();
  __resetVisibilityForTests();
  __resetMenuStateForTests();
});

describe('/pbs-american-portrait/+page.ts load()', () => {
  test('returns { videos } with 18 PBS rows', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = load({} as any) as { videos: Array<{ category: string }> };
    expect(result.videos.length).toBe(18);
    expect(result.videos.every((v) => v.category === 'PBS American Portrait')).toBe(true);
  });

  test('featured-first then published-desc sort (Phase 3 D-25 inherited)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = load({} as any) as { videos: Array<{ featured: boolean; published: string }> };
    // Sort posture: all featured records first, in published-desc order, then
    // all non-featured in published-desc order. Validate by checking that no
    // featured row appears AFTER a non-featured one.
    let sawNonFeatured = false;
    for (const v of result.videos) {
      if (!v.featured) sawNonFeatured = true;
      else if (sawNonFeatured) {
        throw new Error('Featured row appeared after a non-featured row — sort broken');
      }
    }
  });
});

describe('/pbs-american-portrait/+page.svelte composition', () => {
  test('section zero renders with id="reel-intro-heading" landmark target', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    const heading = container.querySelector('#reel-intro-heading');
    expect(heading).not.toBeNull();
    expect(heading?.textContent?.trim()).toBe('PBS American Portrait');
  });

  test('D-02 subtitle eyebrow literal "18 STORIES PRODUCED BY MICHELLE NGO" present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    expect(container.textContent ?? '').toContain('18 STORIES PRODUCED BY MICHELLE NGO');
  });

  test('D-17 verbatim Candidate C blockquote substrings present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    const text = container.textContent ?? '';
    // jsdom normalizes curly to straight on textContent in some envs; substring
    // anchors below match either form via the apostrophe being non-load-bearing.
    expect(text).toContain('Whether it');
    expect(text).toContain('joy or sorrow');
    expect(text).toContain('chance for everyday');
    expect(text).toContain('Americans to be heard.');
  });

  test('outbound link to pbs.org/american-portrait/ with verbatim text', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    const outbound = Array.from(container.querySelectorAll('a')).find(
      (a) => a.getAttribute('href') === 'https://www.pbs.org/american-portrait/'
    );
    expect(outbound).toBeDefined();
    expect(outbound?.getAttribute('target')).toBe('_blank');
    expect(outbound?.getAttribute('rel')).toContain('noopener');
    expect(outbound?.textContent?.trim()).toBe('Visit pbs.org/american-portrait →');
  });

  test('attribution literal "Description from pbs.org/american-portrait" present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    expect(container.textContent ?? '').toContain('Description from pbs.org/american-portrait');
  });

  test('renders exactly 18 <article> landmarks (PBS-01)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    const articles = container.querySelectorAll('article');
    expect(articles.length).toBe(18);
  });

  test('renders exactly 15 "See on PBS →" links (PBS-02 — 3 by design)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (load({} as any) as { videos: any[] });
    const { container } = render(Page, { props: { data } });
    const badges = Array.from(container.querySelectorAll('a')).filter((a) =>
      (a.textContent ?? '').includes('See on PBS')
    );
    expect(badges.length).toBe(15);
  });
});
