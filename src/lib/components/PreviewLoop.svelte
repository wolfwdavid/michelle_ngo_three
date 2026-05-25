<!--
  PreviewLoop — 4-state iframe lifecycle (REEL-06) + 5-layer leak defense.

  State machine:
    unmounted → mounted-loading → mounted-playing → unmounting → (component unmount)
                      ↓ 800ms timeout                 ↑ unified codepath: timeout OR
                      ↓ 'error' postMessage             onError flips to unmounting
                      ↓ → ReelSection's $derived
                      ↓     swaps to PosterImage

  5-layer leak defense (all 5 wired here):
    L1  Svelte {#if} block teardown removes <iframe> from DOM → browser disposes
        contentWindow + decoder + stream. Automatic.
    L2  adapter dispose() in $effect cleanup removes named postMessage listeners
        + sends defensive {method:'removeEventListener'} BEFORE Svelte unmounts.
        Order: clearTimeout → dispose → (Svelte then removes iframe DOM node).
    L3  IntersectionObserver.disconnect() — wired by runed in ReelStage (Plan 03-01).
    L4  Named function references (NOT inline closures) — wired in adapters (Plan 03-02 Task 2/3).
    L5  MessageEvent.origin allowlist — wired in adapters.

  Page Visibility (REEL-07 / D-12):
    documentHidden=true → postMessage pause (300ms budget via $effect synchronous flush)
    documentHidden=false → postMessage play (resume; iframe stays mounted — D-12)
    Both gated on state==='mounted-playing' (Pitfall 5 RESEARCH: don't pause while loading).

  Anti-pattern grep gates (enforced project-wide; see plan acceptance criteria):
    - NO Vimeo player SDK npm dep (RESEARCH lock — raw iframe + raw postMessage only)
    - NO lite embed packages for Vimeo / YouTube
    - NO inline closures in addEventListener (covered by adapter discipline)
-->
<script lang="ts">
  import { onDestroy, getContext } from 'svelte';
  import type { Video } from '$lib/data';
  import { buildEmbedUrl, HANDSHAKE_TIMEOUT_MS } from '$lib/iframe/url';
  import { attachVimeo, type VimeoHandlers } from '$lib/iframe/vimeoAdapter';
  import { attachYouTube, type YouTubeHandlers } from '$lib/iframe/youtubeAdapter';

  // Plan 03-03 ReelSection consumes the `onautoplayfailed` callback to flip its
  // `autoplayFailedFromPreviewLoop` $state — that's the unified REEL-04 trigger
  // for LPM / autoplay-rejection / embed-disabled / EU-blocked (4 of 5 fallback
  // triggers all funnel through this signal). The callback is optional so
  // PreviewLoop can also be mounted in isolation (unit tests, future surfaces).
  let { video, onautoplayfailed }: { video: Video; onautoplayfailed?: () => void } = $props();

  type LifecycleState = 'unmounted' | 'mounted-loading' | 'mounted-playing' | 'unmounting';
  let state = $state<LifecycleState>('mounted-loading');
  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  // Tracks whether documentHidden was previously true. The Page Visibility
  // $effect below ONLY sends postMessage 'play' when transitioning from
  // hidden → visible (NOT on initial render when documentHidden is false-by-default).
  // Without this guard, every mount fires a spurious 'play' postMessage even
  // though the iframe is already auto-playing per URL params.
  let wasHidden = $state(false);

  // Page Visibility broadcast from ReelStage (D-12 / REEL-07)
  const visibility = getContext<{ documentHidden: boolean }>('reel:visibility');

  // Iframe lifecycle $effect — runs after iframeEl binds.
  // Cleanup runs SYNCHRONOUSLY before Svelte removes the iframe DOM node:
  // adapter.dispose() removes postMessage listeners FIRST, then Svelte's
  // {#if} block teardown removes the iframe element (Layer 1). The order is
  // the load-bearing piece of Layer 2 leak defense.
  $effect(() => {
    if (!iframeEl) return;
    const handlers: VimeoHandlers & YouTubeHandlers = {
      onReady: () => {
        // YouTube fires onReady before autoplay actually starts. The 'mounted-playing'
        // transition is gated on onPlay below to keep semantics consistent across providers.
      },
      onPlay: () => {
        clearTimeout(timeoutHandle);
        state = 'mounted-playing';
      },
      onPause: () => {
        // No state transition — paused-while-mounted is normal during Page Visibility hide.
      },
      onError: () => {
        // Unified codepath: error AND timeout both → 'unmounting' → ReelSection
        // swaps to PosterImage. Plan 03-03's PosterImage shows PLAY-WITH-SOUND CTA.
        clearTimeout(timeoutHandle);
        state = 'unmounting';
        onautoplayfailed?.();
      },
    };
    const dispose =
      video.source === 'vimeo'
        ? attachVimeo(iframeEl, handlers)
        : attachYouTube(iframeEl, handlers);

    // D-07: 800ms handshake timeout — the load-bearing detection mechanism for
    // LPM / autoplay-blocked / embed-disabled / EU autoplay restrictions.
    timeoutHandle = setTimeout(() => {
      if (state === 'mounted-loading') {
        state = 'unmounting';
        // Signal ReelSection to swap to PosterImage. Same unified-codepath signal
        // as onError above — REEL-04 fallback triggers 3, 4, 5 (LPM, embed-disabled,
        // EU autoplay restrictions) all funnel through here.
        onautoplayfailed?.();
      }
    }, HANDSHAKE_TIMEOUT_MS);

    return () => {
      // Layer 2: dispose listeners BEFORE Svelte removes iframe DOM node.
      clearTimeout(timeoutHandle);
      dispose();
    };
  });

  // Page Visibility (D-12 / REEL-07) — pause within 300ms when hidden.
  // Pitfall 5 RESEARCH: gate on state==='mounted-playing'. If state is still
  // 'mounted-loading', the iframe hasn't acknowledged ready — postMessage('pause')
  // is silently dropped. When loading completes and visibility is still hidden,
  // the next visibilitychange (or no change at all — page is still hidden) is
  // not what we want; instead, accept the trade: loading-while-hidden iframes
  // continue loading; once they hit mounted-playing they get paused on the next
  // documentHidden flip OR they finish playing first iteration silently.
  $effect(() => {
    if (!iframeEl) return;
    if (state !== 'mounted-playing') return;

    const isHidden = visibility.documentHidden;

    if (isHidden) {
      iframeEl.contentWindow?.postMessage(
        video.source === 'vimeo'
          ? JSON.stringify({ method: 'pause' })
          : JSON.stringify({ event: 'command', func: 'pauseVideo' }),
        video.source === 'vimeo' ? 'https://player.vimeo.com' : 'https://www.youtube-nocookie.com'
      );
    } else if (wasHidden) {
      // ONLY send 'play' on the hidden→visible TRANSITION. Without the `wasHidden`
      // guard, this effect fires postMessage('play') on initial render when
      // documentHidden defaults to false and the iframe is already auto-playing
      // per URL params — spurious play signal. Pitfall: blocker #10 from
      // 03-VERIFICATION plan-checker iteration 1.
      iframeEl.contentWindow?.postMessage(
        video.source === 'vimeo'
          ? JSON.stringify({ method: 'play' })
          : JSON.stringify({ event: 'command', func: 'playVideo' }),
        video.source === 'vimeo' ? 'https://player.vimeo.com' : 'https://www.youtube-nocookie.com'
      );
    }

    wasHidden = isHidden;
  });

  // Belt-and-braces: race-clear the timeout on component destroy.
  // The $effect cleanup above handles the normal path; this catches the
  // weird case where state transitions during teardown.
  onDestroy(() => clearTimeout(timeoutHandle));
</script>

{#if state === 'mounted-loading' || state === 'mounted-playing'}
  <iframe
    bind:this={iframeEl}
    src={buildEmbedUrl(video, 'preview')}
    title={`Preview of ${video.title} by ${video.uploader}`}
    allow="autoplay; fullscreen; picture-in-picture"
    referrerpolicy="strict-origin-when-cross-origin"
    loading="lazy"
    class="absolute inset-0 h-full w-full"
    aria-hidden="true"
    data-lifecycle-state={state}
  ></iframe>
{/if}
<!--
  state === 'unmounting' OR 'unmounted' → PreviewLoop renders nothing.
  ReelSection's $derived flips shouldMount=false and renders <PosterImage> instead.
-->
