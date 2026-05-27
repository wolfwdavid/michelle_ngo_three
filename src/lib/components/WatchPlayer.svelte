<!--
  WatchPlayer — letterboxed iframe + D-07 chrome-fade state machine.
  Phase 5 Plan 05-02 Task 1. WATCH-01 + WATCH-02.

  Letterbox (D-06): outer bg-black min-h-svh canvas; player container
    aspect-video w-full max-h-svh centered via flex. On wide viewports the
    player fills width and proportional left+right black bars appear via flex
    centering; on portrait phones the player occupies width and black bars
    appear above+below. Both axes "letterbox on black" visually.

  Chrome-fade state machine (D-07 — 8 transitions tested in
  WatchPlayer.svelte.test.ts):
    idle → ('play' postMessage + 600ms grace)            → playing-chrome-faded
    playing-chrome-faded → ('pause' postMessage)         → idle (immediate)
    playing-chrome-faded → (pointer-leave canvas)        → playing-chrome-faded
    idle → (pointer-move while isPlaying)                → idle + arm idle-3s
    playing-chrome-faded → (pointer-move)                → idle (immediate fadeIn)
    idle → (idle-3s elapses while isPlaying)             → playing-chrome-faded
    any → (touchend mobile)                              → idle + arm idle-3s

  Adapter dependency (Plan 05-01 closed Finding 1): vimeoAdapter onLoad now
  subscribes to 'pause' postMessage in addition to 'play' + 'error'. This
  component's onPause handler is therefore actually delivered by Vimeo.

  iOS Safari in-document playback (Plan 05-01 closed Finding 11):
  buildEmbedUrl(video, 'play') now emits `playsinline=1` for both providers,
  so tap-to-play stays in-document and our postMessage flow survives.

  Cellular bypass (D-09): click=consent + URL=action — NO REEL-04 fallback on
  /watch/[id]; the iframe ALWAYS attempts autoplay-with-sound. The provider's
  native ▷ overlay is the recovery UX (iOS LPM, no sticky activation).

  chromeFaded $bindable (D-08): the route's +page.svelte does
    `<WatchPlayer {video} bind:chromeFaded />`
  and applies opacity classes on the back-button + h1 + CategoryTag + uploader
  metadata + ContinueReelRail heading region — they all share ONE fade state.
-->
<script lang="ts">
  import type { Video } from '$lib/data';
  import { buildEmbedUrl } from '$lib/iframe/url';
  import { attachVimeo, type VimeoHandlers } from '$lib/iframe/vimeoAdapter';
  import { attachYouTube, type YouTubeHandlers } from '$lib/iframe/youtubeAdapter';

  let {
    video,
    chromeFaded = $bindable(false),
  }: {
    video: Video;
    chromeFaded?: boolean;
  } = $props();

  let iframeEl = $state<HTMLIFrameElement | null>(null);

  // D-07 fade-state-machine internals (non-reactive scalars are fine here;
  // chromeFaded is the only $bindable surface the route consumes).
  let isPlaying = $state(false);
  let playGraceTimer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const FADE_GRACE_MS = 600; // D-07
  const IDLE_FADE_MS = 3000; // D-07

  function fadeOut(): void {
    clearTimeout(playGraceTimer);
    playGraceTimer = setTimeout(() => {
      chromeFaded = true;
    }, FADE_GRACE_MS);
  }
  function fadeIn(): void {
    clearTimeout(playGraceTimer);
    chromeFaded = false;
    resetIdleTimer();
  }
  function resetIdleTimer(): void {
    clearTimeout(idleTimer);
    if (isPlaying) {
      idleTimer = setTimeout(() => {
        chromeFaded = true;
      }, IDLE_FADE_MS);
    }
  }

  function onPointerMove(): void {
    fadeIn();
  }
  function onPointerLeave(): void {
    if (isPlaying) chromeFaded = true;
  }
  function onTouchEnd(): void {
    fadeIn();
  }

  $effect(() => {
    if (!iframeEl) return;
    const handlers: VimeoHandlers & YouTubeHandlers = {
      onReady: () => {
        /* no-op — autoplay-with-sound is the URL contract */
      },
      onPlay: () => {
        isPlaying = true;
        fadeOut();
        resetIdleTimer();
      },
      onPause: () => {
        isPlaying = false;
        fadeIn();
      },
      onError: () => {
        /* native ▷ overlay is the recovery UX — no synthesized fallback on /watch/[id] */
      },
    };
    const dispose =
      video.source === 'vimeo'
        ? attachVimeo(iframeEl, handlers)
        : attachYouTube(iframeEl, handlers);
    return () => {
      clearTimeout(playGraceTimer);
      clearTimeout(idleTimer);
      dispose();
    };
  });
</script>

<!-- D-06 letterbox: outer bg-black min-h-svh; player aspect-video w-full
     max-h-svh centered via flex. Pointer events on the canvas drive the
     D-07 chrome-fade state machine. role="presentation" silences the
     a11y_no_static_element_interactions warning — the canvas itself is
     decorative; the iframe inside owns the interactive surface. -->
<div
  class="relative flex min-h-svh items-center justify-center bg-black"
  role="presentation"
  onpointermove={onPointerMove}
  onpointerleave={onPointerLeave}
  ontouchend={onTouchEnd}
>
  <div class="aspect-video max-h-svh w-full">
    <iframe
      bind:this={iframeEl}
      src={buildEmbedUrl(video, 'play')}
      title={video.title}
      allow="autoplay; fullscreen; picture-in-picture"
      referrerpolicy="strict-origin-when-cross-origin"
      loading="lazy"
      class="h-full w-full border-0"
      data-chrome-faded={chromeFaded}
    ></iframe>
  </div>
</div>
