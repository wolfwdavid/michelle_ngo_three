<!--
  Phase 1 plan 01 minimal layout. Imports app.css so Tailwind utilities resolve
  on every route. Noindex meta inherits _four D-11 staging posture (CONTEXT
  Out of Scope: staging-noindex stays through Phase 6 per Pitfall 9).

  Phase 4 (NAV-01) will add <TopNav />; Phase 6 (CONT-03) will add <Footer />.
-->
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
  <title>Michelle Ngo</title>
</svelte:head>

{@render children()}
