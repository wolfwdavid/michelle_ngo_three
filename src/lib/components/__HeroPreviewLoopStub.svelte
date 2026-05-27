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

  // The `video` prop is required by the contract HeroAmbient passes; the stub
  // doesn't use it but $props() must accept it to mirror PreviewLoop's surface.
  // The eslint disable below covers svelte's no-unused-props rule (the prop IS
  // declared in the type but intentionally not consumed in this test-only stub).
  // eslint-disable-next-line svelte/no-unused-props
  let { onautoplayfailed }: { video: Video; onautoplayfailed?: () => void } = $props();

  // Push the callback into the shared registry so tests can fire it. Wrapped
  // in $effect.pre so the prop is read inside a reactive closure (avoiding the
  // svelte/state_referenced_locally warning that fires on top-level prop reads).
  $effect.pre(() => {
    const cb = onautoplayfailed;
    if (!cb) return;
    const reg = (
      globalThis as { __heroPreviewLoopFailCallbacks?: Array<() => void> }
    ).__heroPreviewLoopFailCallbacks;
    if (reg) reg.push(cb);
  });
</script>

<div data-stub="preview-loop" class="absolute inset-0">
  <iframe title="stubbed preview" class="absolute inset-0 h-full w-full"></iframe>
</div>
