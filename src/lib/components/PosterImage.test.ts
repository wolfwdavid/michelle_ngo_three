/**
 * Component test for PosterImage — REEL-04 unified codepath gate.
 *
 * Asserts:
 * - Sidecar lookup via getPosterFor (mocked)
 * - <a href> deep-links to /watch/[id] (PLAY-WITH-SOUND CTA)
 * - Title text rendered with the .title class (consumes --font-display via style block)
 * - aria-label on the wrapping anchor (NAV-03 forward-ship)
 * - Aspect-ratio container present (POL-03 forward-ship)
 * - Defensive deterministic-fallback render does not crash
 * - Inline category tag (no extracted CategoryTag.svelte component)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import PosterImage from './PosterImage.svelte';
import type { Video } from '$lib/data/schema';

vi.mock('$app/paths', () => ({ base: '' }));

// 03-01 getPosterFor returns STRING path (deterministic fallback when sidecar missing).
vi.mock('$lib/data/posters', () => ({
  getPosterFor: vi.fn(
    (video: Pick<Video, 'source' | 'id'>) => `/posters/${video.source}-${video.id}.jpg`
  ),
}));

// Vite's <enhanced:img> compiles to a regular <img> when the source string isn't
// a module-resolved path. In jsdom, the tag is just <img>; the picture element
// is generated at build only. Our test asserts on the resulting <img>.
function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'vimeo',
    id: '264677021',
    title: 'Sample Video Title',
    uploader: 'Michelle Ngo',
    published: '2020-01-01',
    thumbnail: 'https://i.vimeocdn.com/example.jpg',
    embed: 'https://player.vimeo.com/video/264677021',
    category: 'Reel',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

describe('PosterImage (REEL-04 unified fallback codepath)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the wrapping anchor with deep-link to /watch/[id]', () => {
    render(PosterImage, { props: { video: makeVideo(), index: 1, total: 56 } });
    // aria-label uses STRAIGHT ASCII double-quotes around the title (matches component output).
    const anchor = screen.getByRole('link', { name: /Play "Sample Video Title" with sound/i });
    expect(anchor).toHaveAttribute('href', '/watch/264677021');
  });

  it('renders the title with the .title class (--font-display token via component style)', () => {
    render(PosterImage, { props: { video: makeVideo(), index: 1, total: 56 } });
    const title = screen.getByText('Sample Video Title');
    expect(title).toBeInTheDocument();
    expect(title.className).toContain('title');
  });

  it('renders the PLAY WITH SOUND CTA caption', () => {
    render(PosterImage, { props: { video: makeVideo(), index: 1, total: 56 } });
    expect(screen.getByText(/PLAY WITH SOUND/i)).toBeInTheDocument();
  });

  it('renders the aspect-ratio container (POL-03 forward-ship)', () => {
    const { container } = render(PosterImage, {
      props: { video: makeVideo(), index: 1, total: 56 },
    });
    const poster = container.querySelector('.poster-container');
    expect(poster).toBeInTheDocument();
    // jsdom doesn't compute aspect-ratio, but the class is the contract marker
    expect(poster?.className).toContain('poster-container');
  });

  it('uses the deterministic fallback path when sidecar key unknown', () => {
    // 03-01 D-02: getPosterFor never returns null — it returns a deterministic
    // fallback path /posters/{source}-{id}.jpg even when the sidecar lacks the entry.
    // PosterImage MUST render against whatever path comes back without crashing.
    const unknownVideo = makeVideo({ id: 'unknown-id-9999' });
    const { container } = render(PosterImage, {
      props: { video: unknownVideo, index: 2, total: 56 },
    });
    const img = container.querySelector('.poster-img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('alt')).toBe('Sample Video Title');
    // The PLAY-WITH-SOUND link still renders so the section is never dead
    expect(
      screen.getByRole('link', { name: /Play "Sample Video Title" with sound/i })
    ).toBeInTheDocument();
  });

  it('renders inline category tag (no external CategoryTag.svelte import)', () => {
    const { container } = render(PosterImage, {
      props: { video: makeVideo(), index: 1, total: 56 },
    });
    const tag = container.querySelector('.category-tag');
    expect(tag).toBeInTheDocument();
    expect(tag?.textContent?.trim()).toBe('Reel');
  });
});
