<!--
  Phase 6 Plan 06-03 — /about (ABT-01 + CONT-01 partial).

  Decisions implemented:
    D-09 — two-act layout mirroring /: Act 1 ambient hero + Act 2 dark canvas bio
    D-10 — bio + ContactBlock stacked in same vertical scroll on Act 2, max-w-2xl,
            mt-12 below bio for ContactBlock (consolidated from prior mt-10 md:mt-12
            per UI-SPEC §"Spacing exceptions")
    D-19 — bio paragraph copied VERBATIM from 06-03-PLAN.md <approved>...</approved>
            element (user approved verbatim). DO NOT rewrite, summarize, or
            paraphrase. If a future content edit is needed, update PLAN's <approved>
            and re-paste the text here. Straight apostrophes (') match the
            _four-shipped, user-approved source byte-for-byte.
    D-21 — IMDb/LinkedIn ship as channel-homepage fallbacks; URLs duplicated here
            for Person JSON-LD sameAs (single-source-of-truth comment below).

  Visible "ABOUT" wordmark in Act 1 is decorative (rendered by HeroAmbient's
  wordmark prop); semantic landmark h1 is sr-only "About Michelle Ngo".
-->
<script lang="ts">
  import HeroAmbient from '$lib/components/HeroAmbient.svelte';
  import ContactBlock from '$lib/components/ContactBlock.svelte';

  // Phase 6 D-21 / RESEARCH §"Footer Integration > Single-source-of-truth pattern":
  // Person JSON-LD sameAs values. MUST match the literals in
  // src/lib/components/ContactBlock.svelte (single source of truth for the visible
  // links; this duplication is intentional because ContactBlock does not export its
  // URL constants). Update BOTH files together if URLs change.
  //
  // v1.0 launch state (D-21): IMDb + LinkedIn ship as channel-homepage fallbacks —
  // personalized profile URLs were not materializable before cutover. Post-launch
  // backlog item: swap to personalized URLs of the shape
  // `https://www.imdb.com/name/nm{NUMERIC_ID}/` and
  // `https://www.linkedin.com/in/{HANDLE}/` — single-line edit in BOTH this file
  // AND ContactBlock.svelte. The existing substring-contains test assertions
  // (`toContain('imdb.com')` etc.) survive the swap without test changes.
  const IMDB_URL = 'https://www.imdb.com/';
  const LINKEDIN_URL = 'https://www.linkedin.com/';
  const VIMEO_URL = 'https://vimeo.com/user2149742';

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Michelle Ngo',
    jobTitle: 'Filmmaker, Producer',
    url: 'https://michellengo.net/about/',
    sameAs: [IMDB_URL, LINKEDIN_URL, VIMEO_URL],
  };
</script>

<svelte:head>
  <title>About — Michelle Ngo</title>
  <meta
    name="description"
    content="Michelle Ngo — filmmaker and producer based in New York City."
  />
  <!-- D-15 (from _four; carried forward to /three as the same posture per RESEARCH
       §"Footer Integration") Person JSON-LD for SEO knowledge-panel candidacy.
       {@html} is safe here: personJsonLd is JSON.stringify of a hardcoded static
       object literal — no user input flows in. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${JSON.stringify(personJsonLd)}<` + `/script>`}
</svelte:head>

<!-- ACT 1 — ambient producer-reel hero with ABOUT wordmark (D-09). Reuses
     HeroAmbient verbatim with parameterized wordmark; tagline omitted to keep
     Act 1 chrome minimal so the ambient reel breathes (UI-SPEC Surface 3). -->
<HeroAmbient wordmark="ABOUT" tagline={undefined} />

<!-- ACT 2 — dark canvas bio + ContactBlock (D-09 + D-10).
     Landmark: <section> inside the layout's <main> (NOT nested main) per
     UI-SPEC Surface 3 + axe rule. sr-only h1 carries the semantic landmark
     heading (visible "ABOUT" is decorative). -->
<section class="bg-neutral-950 py-16 md:py-24">
  <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
    <h1 class="sr-only">About Michelle Ngo</h1>

    <p class="font-sans text-base font-normal leading-relaxed text-neutral-50">
      <!-- BEGIN approved bio (D-19) — copied VERBATIM from 06-03-PLAN.md <approved>...</approved>.
           Straight apostrophes (') and em-dash (—) match the user-approved _four source byte-for-byte. -->
      I'm Michelle Ngo, a filmmaker and producer based in New York City. I make video that helps brands
      and broadcasters tell stories well — short documentaries, branded films, promos, and trailers. My
      credits include PBS American Portrait, HBO Max, HBO, ABC News, U2's Sphere residency, Amazon News,
      and Music Box Films. I love a tight schedule and a thoughtful script. I work hardest when the subject
      matter is human — real people telling true stories about how they live, what they make, and why
      it matters. If you have a project that needs a steady hand and a quick turn, get in touch.
      <!-- END approved bio -->
    </p>

    <div class="mt-12">
      <ContactBlock />
    </div>
  </div>
</section>
