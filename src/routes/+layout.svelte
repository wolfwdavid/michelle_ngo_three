<!--
  Phase 1 plan 01 minimal layout. Imports app.css so Tailwind utilities resolve
  on every route. Noindex meta inherits _four D-11 staging posture (CONTEXT
  Out of Scope: staging-noindex stays through Phase 6 per Pitfall 9).

  Phase 4 (NAV-01) will add <TopNav />; Phase 6 (CONT-03) will add <Footer />.
-->
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initMotionState } from '$lib/state/motion.svelte';
  import { initNetworkState } from '$lib/state/network.svelte';

  let { children } = $props();

  // Hydrate the module-scope state runes (REEL-04 triggers 1 + 2; D-08).
  // SSR/prerender does NOT call these — both helpers are __isBrowser-guarded
  // and the call site is onMount (browser-only). Idempotent so HMR re-mounts
  // can't double-bind the matchMedia / navigator.connection change listeners.
  onMount(() => {
    initMotionState();
    initNetworkState();
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
  <title>Michelle Ngo</title>
</svelte:head>

{@render children()}
