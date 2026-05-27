<!--
  Test-only stub replacing PreviewLoop.svelte in HeroAmbient.svelte.test.ts.

  Renders a minimal data-stub="preview-loop" container plus a placeholder
  iframe (so tests that query `iframe` against HeroAmbient still find one
  when the mount gate is open). Registers its onautoplayfailed prop in a
  global registry so tests can synchronously fire the REEL-04 trigger 3
  signal without driving the real 800ms HANDSHAKE_TIMEOUT_MS or the Vimeo
  postMessage adapter pipeline.

  Production code MUST NOT import this — vi.mock in HeroAmbient.svelte.test.ts
  swaps PreviewLoop.svelte for this stub at module-load time.
-->
<script lang="ts">
  import type { Video } from '$lib/data';

  let {
    video: _video,
    onautoplayfailed,
  }: {
    video: Video;
    onautoplayfailed?: () => void;
  } = $props();

  // Push the callback into the shared registry so tests can fire it.
  if (onautoplayfailed) {
    const reg = (
      globalThis as { __heroPreviewLoopFailCallbacks?: Array<() => void> }
    ).__heroPreviewLoopFailCallbacks;
    if (reg) reg.push(onautoplayfailed);
  }
</script>

<div data-stub="preview-loop" class="absolute inset-0">
  <iframe title="stubbed preview" class="absolute inset-0 h-full w-full"></iframe>
</div>
