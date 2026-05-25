<!--
  Test-only PreviewLoop stub for Plan 03-03 Task 2 wiring tests.

  Real PreviewLoop dispatches `onautoplayfailed` after 800ms HANDSHAKE_TIMEOUT_MS
  OR on iframe onError. To test ReelSection's wiring of that signal without
  waiting for real timeouts (and without spinning up real Vimeo/YouTube
  postMessage adapters in jsdom), this stub:

  1. Renders a tiny `<span data-stub="preview-loop-fail">` placeholder ReelSection
     can detect via querySelector (the "PreviewLoop branch is active" assertion).
  2. Stashes its `onautoplayfailed` callback on a shared registry
     (`globalThis.__previewLoopFailCallbacks`) so the test can invoke it
     synchronously, then assert the ReelSection swap.

  Not shipped to production; not imported by any non-test code; lives next to
  PreviewLoop.svelte under a double-underscore prefix per the existing
  ReelSectionContextHarness pattern.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Video } from '$lib/data';

  // Accept the same props PreviewLoop exposes so the call site signature
  // matches without changes. video is read for the data attribute below.
  let { video, onautoplayfailed }: { video: Video; onautoplayfailed?: () => void } = $props();

  // Register the onautoplayfailed callback on mount so tests can invoke it
  // synchronously after rendering. We use a global registry array (not a Map
  // keyed by video id) because the test only cares about per-mount fire order;
  // tests that need per-id targeting can filter by `__lastMountedVideoId`.
  onMount(() => {
    const registry = (globalThis as { __previewLoopFailCallbacks?: Array<() => void> })
      .__previewLoopFailCallbacks;
    if (registry && onautoplayfailed) {
      registry.push(onautoplayfailed);
    }
  });
</script>

<span data-stub="preview-loop-fail" data-video-id={video.id} aria-hidden="true"></span>
