/**
 * iframe URL builder for Vimeo + YouTube embeds.
 *
 * Locked decisions (D-12 / REEL-02 / RESEARCH §Code Examples):
 *
 * VIMEO preview:
 *   https://player.vimeo.com/video/{id}
 *     ?autoplay=1&dnt=1&muted=1&loop=1&background=1&quality=540p&playsinline=1
 *
 *   - background=1 implies muted+loop+autoplay+no-chrome (Vimeo docs verified)
 *     but does NOT override explicit quality= (Pitfall 2 verified)
 *   - dnt=1 = Vimeo Do-Not-Track (D-06 EU posture; no analytics cookies fired)
 *   - quality=540p caps bandwidth per Pitfall 4 (project bandwidth ethics)
 *   - playsinline=1 required for iOS Safari 16/17.0/17.1 (Pitfall 1)
 *
 * YOUTUBE preview:
 *   https://www.youtube-nocookie.com/embed/{id}
 *     ?autoplay=1&mute=1&loop=1&playlist={id}&playsinline=1
 *     &modestbranding=1&vq=medium&iv_load_policy=3&enablejsapi=1&controls=0
 *
 *   - youtube-nocookie.com host (NOT youtube.com) — D-06 EU posture
 *   - playlist={id} REQUIRED — loop=1 alone does NOT loop a single YouTube video (Pitfall 3)
 *   - enablejsapi=1 REQUIRED — without it, iframe ignores postMessage {event:'listening'}
 *   - modestbranding=1 + controls=0 + iv_load_policy=3 = clean cinematic chrome
 *   - vq=medium is a HINT only (not enforced), still useful for bandwidth signaling
 *
 * Sources:
 *   - https://help.vimeo.com/hc/en-us/articles/12426260232977-About-Player-Parameters
 *   - https://help.vimeo.com/hc/en-us/articles/12426285089681-About-embedding-background-and-Chromeless-videos
 *   - https://developers.google.com/youtube/iframe_api_reference
 *   - https://developers.google.com/youtube/player_parameters
 *
 * Pure function — no DOM, no window. Runnable in node-env data Vitest project.
 */
import type { Video } from '$lib/data';

/**
 * Locked starting value (D-07). RESEARCH Pitfall 1: if BrowserStack matrix QA
 * on iOS Safari 3G shows premature fallback, escalation is bump to 1200ms —
 * NOT abandon the mechanism. PreviewLoop imports this constant; do NOT inline
 * the magic number at the call site.
 */
export const HANDSHAKE_TIMEOUT_MS = 800 as const;

const VIMEO_QUALITY_PREVIEW = '540p' as const; // Pitfall 4 cap
const YOUTUBE_QUALITY_HINT = 'medium' as const; // vq hint

export type EmbedMode = 'preview' | 'play';

export function buildEmbedUrl(video: Video, mode: EmbedMode): string {
  if (video.source === 'vimeo') {
    const base = `https://player.vimeo.com/video/${video.id}`;
    const params = new URLSearchParams();
    params.set('autoplay', '1');
    params.set('dnt', '1'); // D-06: Vimeo Do-Not-Track for EU posture
    // Phase 5 Finding 11 / Pitfall B: playsinline=1 in BOTH modes. Pitfall 1
    // already required it for the preview-mode iOS 16/17 autoplay handshake;
    // 'play' mode needs it too — without it, iOS Safari tap-to-play detaches
    // the embed to native fullscreen and the WatchPlayer chrome-fade
    // postMessage flow (D-07) breaks because the iframe is no longer the
    // active surface. Universal on both modes keeps it in-document.
    params.set('playsinline', '1');
    if (mode === 'preview') {
      params.set('muted', '1');
      params.set('loop', '1');
      params.set('background', '1'); // implies muted+loop+autoplay+no-chrome
      params.set('quality', VIMEO_QUALITY_PREVIEW); // Pitfall 4 cap
    }
    return `${base}?${params.toString()}`;
  }
  // YouTube — D-06: nocookie host always
  const base = `https://www.youtube-nocookie.com/embed/${video.id}`;
  const params = new URLSearchParams();
  params.set('autoplay', '1');
  params.set('modestbranding', '1');
  params.set('iv_load_policy', '3');
  params.set('enablejsapi', '1'); // required for postMessage protocol
  // Phase 5 Finding 11 / Pitfall B: same rationale as the Vimeo branch above.
  // iOS Safari tap-to-play stays in-document only with playsinline=1; without
  // it, the YouTube embed detaches to native fullscreen and breaks postMessage
  // event flow. Set unconditionally for both 'preview' and 'play' modes.
  params.set('playsinline', '1');
  if (mode === 'preview') {
    params.set('mute', '1');
    params.set('loop', '1');
    params.set('playlist', video.id); // Pitfall 3: loop=1 ALONE does not loop YouTube
    params.set('vq', YOUTUBE_QUALITY_HINT);
    params.set('controls', '0');
  }
  return `${base}?${params.toString()}`;
}
