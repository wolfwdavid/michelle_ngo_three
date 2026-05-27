import { describe, test, expect } from 'vitest';
import { buildEmbedUrl, HANDSHAKE_TIMEOUT_MS } from './url';
import { videos } from '$lib/data';
import type { Video } from '$lib/data';

/**
 * URL builder tests (REEL-02 / D-12 / RESEARCH §Code Examples).
 *
 * Locked param contracts:
 *   Vimeo preview: autoplay=1, dnt=1, muted=1, loop=1, background=1,
 *                  quality=540p, playsinline=1
 *   YouTube preview: autoplay=1, mute=1, loop=1, playlist={id}, playsinline=1,
 *                    modestbranding=1, vq=medium, iv_load_policy=3,
 *                    enablejsapi=1, controls=0
 *
 * Pure function — no DOM, no window access.
 */

function makeVimeoVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'vimeo',
    id: '264677021',
    title: 'Sample Vimeo',
    uploader: 'Michelle Ngo',
    published: '2024-01-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://player.vimeo.com/video/264677021',
    category: 'PBS American Portrait',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

function makeYouTubeVideo(overrides: Partial<Video> = {}): Video {
  return {
    source: 'youtube',
    id: 'sample123',
    title: 'Sample YouTube',
    uploader: 'Michelle Ngo',
    published: '2024-01-01',
    thumbnail: 'https://example.com/t.jpg',
    embed: 'https://www.youtube-nocookie.com/embed/sample123',
    category: 'Branded Content',
    featured: false,
    hidden: false,
    tags: [],
    ...overrides,
  } as Video;
}

describe('buildEmbedUrl — Vimeo preview', () => {
  test('Vimeo preview URL contains ALL required params', () => {
    const v = makeVimeoVideo({ id: '264677021' });
    const url = buildEmbedUrl(v, 'preview');
    expect(url.startsWith('https://player.vimeo.com/video/264677021?')).toBe(true);
    expect(url).toContain('autoplay=1');
    expect(url).toContain('dnt=1');
    expect(url).toContain('muted=1');
    expect(url).toContain('loop=1');
    expect(url).toContain('background=1');
    expect(url).toContain('quality=540p');
    expect(url).toContain('playsinline=1');
  });

  test('Vimeo play mode URL has autoplay=1, dnt=1, AND playsinline=1 (Finding 11 / Pitfall B) but NO preview-only params', () => {
    const v = makeVimeoVideo({ id: '111' });
    const url = buildEmbedUrl(v, 'play');
    expect(url.startsWith('https://player.vimeo.com/video/111?')).toBe(true);
    expect(url).toContain('autoplay=1');
    expect(url).toContain('dnt=1');
    // Phase 5 Finding 11 / Pitfall B: playsinline=1 in 'play' mode keeps iOS
    // Safari tap-to-play in-document — without it the embed detaches to native
    // fullscreen and the chrome-fade postMessage flow breaks.
    expect(url).toContain('playsinline=1');
    expect(url).not.toContain('background=1');
    expect(url).not.toContain('muted=1');
    expect(url).not.toContain('quality=');
    expect(url).not.toContain('loop=');
  });

  test('buildEmbedUrl vimeo preview still includes playsinline=1 (regression)', () => {
    const v = makeVimeoVideo({ id: '222' });
    const url = buildEmbedUrl(v, 'preview');
    expect(url).toContain('playsinline=1');
    expect(url).toContain('background=1');
    expect(url).toContain('muted=1');
  });
});

describe('buildEmbedUrl — YouTube preview', () => {
  test('YouTube preview URL contains ALL required params', () => {
    const v = makeYouTubeVideo({ id: 'sample123' });
    const url = buildEmbedUrl(v, 'preview');
    expect(url.startsWith('https://www.youtube-nocookie.com/embed/sample123?')).toBe(true);
    expect(url).toContain('autoplay=1');
    expect(url).toContain('mute=1');
    expect(url).toContain('loop=1');
    expect(url).toContain('playlist=sample123');
    expect(url).toContain('playsinline=1');
    expect(url).toContain('modestbranding=1');
    expect(url).toContain('vq=medium');
    // URLSearchParams encodes underscores raw; iv_load_policy=3 stays intact.
    expect(url).toContain('iv_load_policy=3');
    expect(url).toContain('enablejsapi=1');
    expect(url).toContain('controls=0');
  });

  test('YouTube URL ALWAYS uses youtube-nocookie.com host (D-06 EU posture)', () => {
    const v = makeYouTubeVideo();
    const previewUrl = buildEmbedUrl(v, 'preview');
    const playUrl = buildEmbedUrl(v, 'play');
    expect(previewUrl).not.toContain('https://www.youtube.com');
    expect(playUrl).not.toContain('https://www.youtube.com');
    expect(previewUrl).toContain('https://www.youtube-nocookie.com');
    expect(playUrl).toContain('https://www.youtube-nocookie.com');
  });

  test('YouTube preview playlist= exactly matches video id (Pitfall 3 — loop= alone broken)', () => {
    const v = makeYouTubeVideo({ id: 'abcXYZ' });
    const url = buildEmbedUrl(v, 'preview');
    expect(url).toContain('playlist=abcXYZ');
  });

  test('YouTube play mode URL has autoplay/modestbranding/iv_load_policy/enablejsapi AND playsinline=1 (Finding 11 / Pitfall B) but NO preview-only params', () => {
    const v = makeYouTubeVideo({ id: 'zzz' });
    const url = buildEmbedUrl(v, 'play');
    expect(url).toContain('autoplay=1');
    expect(url).toContain('modestbranding=1');
    expect(url).toContain('iv_load_policy=3');
    expect(url).toContain('enablejsapi=1');
    // Phase 5 Finding 11 / Pitfall B: same rationale as Vimeo — iOS Safari
    // tap-to-play stays in-document only with playsinline=1.
    expect(url).toContain('playsinline=1');
    expect(url).not.toContain('mute=1');
    expect(url).not.toContain('loop=');
    expect(url).not.toContain('playlist=');
    expect(url).not.toContain('controls=0');
  });

  test('buildEmbedUrl youtube preview still includes playsinline=1 (regression)', () => {
    const v = makeYouTubeVideo({ id: '9Zmw69UZSsI' });
    const url = buildEmbedUrl(v, 'preview');
    expect(url).toContain('playsinline=1');
    expect(url).toContain('mute=1');
    expect(url).toContain('playlist=9Zmw69UZSsI');
  });
});

describe('buildEmbedUrl — purity + constants', () => {
  test('URL builder is pure — same input → same output', () => {
    const v = makeVimeoVideo({ id: 'pure-1' });
    expect(buildEmbedUrl(v, 'preview')).toBe(buildEmbedUrl(v, 'preview'));
    expect(buildEmbedUrl(v, 'play')).toBe(buildEmbedUrl(v, 'play'));
  });

  test('HANDSHAKE_TIMEOUT_MS exported and === 800 (D-07)', () => {
    expect(HANDSHAKE_TIMEOUT_MS).toBe(800);
  });
});

describe('buildEmbedUrl — snapshot against all 56 videos in videos.json', () => {
  test('every video produces a valid preview URL with provider-locked contracts', () => {
    expect(videos.length).toBeGreaterThan(0);
    for (const v of videos) {
      const url = buildEmbedUrl(v, 'preview');
      if (v.source === 'vimeo') {
        expect(url.startsWith(`https://player.vimeo.com/video/${v.id}?`)).toBe(true);
        expect(url).toContain('background=1');
        expect(url).toContain('quality=540p');
        expect(url).toContain('dnt=1');
        expect(url).toContain('playsinline=1');
      } else {
        expect(url.startsWith(`https://www.youtube-nocookie.com/embed/${v.id}?`)).toBe(true);
        expect(url).toContain(`playlist=${v.id}`);
        expect(url).toContain('enablejsapi=1');
        expect(url).toContain('modestbranding=1');
        expect(url).toContain('iv_load_policy=3');
        expect(url).not.toContain('https://www.youtube.com');
      }
    }
  });

  test('every video produces a valid play URL', () => {
    for (const v of videos) {
      const url = buildEmbedUrl(v, 'play');
      if (v.source === 'vimeo') {
        expect(url.startsWith(`https://player.vimeo.com/video/${v.id}?`)).toBe(true);
        expect(url).toContain('autoplay=1');
        expect(url).toContain('dnt=1');
      } else {
        expect(url.startsWith(`https://www.youtube-nocookie.com/embed/${v.id}?`)).toBe(true);
        expect(url).toContain('autoplay=1');
        expect(url).toContain('enablejsapi=1');
      }
    }
  });
});
