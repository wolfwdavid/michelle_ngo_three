<!--
  Phase 6 Plan 06-03 — /contact (CONT-01 home).

  Decisions implemented:
    D-11 — splash bg = producer-reel poster STATIC (NO iframe; never iframe per D-11
            deliberate differentiation from /about's ambient muted reel)
    D-12 — composition: MICHELLE NGO wordmark top + ContactBlock centered +
            ↓ scroll-cue at bottom inviting scroll to Footer below

  Landmark: <section> inside layout's <main> (NOT nested main) per UI-SPEC + axe.
  sr-only h1 carries the semantic landmark heading (visible "MICHELLE NGO" is decorative).

  Below this h-svh splash, the site-wide <Footer /> mounted in +layout.svelte
  (Plan 06-01) scrolls into view via natural document scroll — the scroll-cue
  cues the producer to discover the directory below.

  TopNav: stays SOLID on /contact (NOT in REEL_ROUTE_IDS fade scope per D-16).

  ESLint: svelte/no-navigation-without-resolve disabled via the config-level
  per-file override in eslint.config.js (mirror of TopNav/FilterPillBar/Footer/
  press pattern — `${base}${getPosterFor(...)}` literal img src).
-->
<script lang="ts">
  import { base } from '$app/paths';
  import { producerReelId, getById } from '$lib/data';
  import { getPosterFor } from '$lib/data/posters';
  import ContactBlock from '$lib/components/ContactBlock.svelte';

  const producerReel = getById(producerReelId);
  if (!producerReel) throw new Error('/contact: producer reel video missing from $lib/data');
  const heroPosterUrl = `${base}${getPosterFor(producerReel)}`;
</script>

<svelte:head>
  <title>Contact — Michelle Ngo</title>
  <meta
    name="description"
    content="Get in touch with Michelle Ngo — email, phone, IMDb, LinkedIn, Vimeo."
  />
</svelte:head>

<section class="relative h-svh w-full overflow-hidden bg-neutral-950">
  <!-- Layer 1: poster bg (STATIC — D-11 never iframe) -->
  <img
    src={heroPosterUrl}
    alt=""
    loading="eager"
    fetchpriority="high"
    class="absolute inset-0 h-full w-full object-cover"
  />
  <!-- Layer 2: two-stop gradient overlay (D-11 — matches Phase 5 D-05 + UI-SPEC two-stop gradient tokens) -->
  <div
    class="pointer-events-none absolute inset-0"
    style="background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%);"
    aria-hidden="true"
  ></div>
  <!-- Layer 3: D-12 composition — wordmark upper-third + ContactBlock center + scroll-cue bottom -->
  <div
    class="relative z-10 flex h-full flex-col items-center justify-between px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8"
  >
    <!-- Upper-third: MICHELLE NGO display wordmark (visual rhyme with / HeroAmbient — same typography per UI-SPEC) -->
    <p class="font-display text-6xl font-semibold leading-tight tracking-[0.2em] text-neutral-50">
      MICHELLE NGO
    </p>
    <!-- sr-only landmark h1 -->
    <h1 class="sr-only">Contact Michelle Ngo</h1>
    <!-- Center: ContactBlock as 5-row vertical list -->
    <div>
      <ContactBlock />
    </div>
    <!-- Bottom: scroll-cue inviting Footer reveal -->
    <div class="text-neutral-50/60" aria-hidden="true">
      <span class="text-2xl">↓</span>
    </div>
  </div>
</section>
