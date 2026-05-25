<!--
  Phase 1 SC #4 smoke: tiny Svelte 5 component that @testing-library/svelte
  can mount + query. Proves the runes-mode component compilation pipeline
  works end-to-end and TLS 5.3.1 is wired against Svelte 5.55.5.
  Deleted in Phase 3 when ReelSection arrives.
-->
<script lang="ts">
  let { greeting = 'hello' }: { greeting?: string } = $props();
  let count = $state(0);
</script>

<section>
  <h1 data-testid="greeting">{greeting}</h1>
  <button type="button" onclick={() => count++} data-testid="counter">
    clicked {count}
  </button>
</section>
