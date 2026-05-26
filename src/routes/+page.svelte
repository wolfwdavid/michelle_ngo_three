<!--
  D-01 splash placeholder. Matches _four D-09/D-10 verbatim posture for
  A/B-parity-neutral build-window UX. Phase 5 (HERO-01/02/03) replaces
  this with the full <HeroAmbient /> always-mounted producer reel.

  Locked decisions inlined here:
    D-01  wordmark + tagline placeholder, centered, dark bg
    D-02  bg-neutral-950 = oklch(0.16 0 0) (Tailwind v4 reads --color-neutral-950 from @theme)
    D-03  wordmark uses --font-display (Source Serif 4)
    D-04  tagline literal: "Filmmaker. Site coming soon."

  Plan 04-02 NAV-03 (Rule 3 deviation): the splash content now renders inside
  the layout's <main id="main"> wrapper. This file's outer container changed
  from <main> -> <div> to avoid nested landmark roles (axe + WCAG 1.3.1).
-->
<svelte:head>
  <title>Michelle Ngo — Filmmaker</title>
  <meta name="description" content="Michelle Ngo — Filmmaker. Site coming soon." />
</svelte:head>

<div class="flex min-h-svh flex-col items-center justify-center bg-neutral-950 text-neutral-100">
  <h1 class="font-display text-5xl font-semibold tracking-[0.2em] md:text-7xl">
    MICHELLE NGO
  </h1>
  <p class="mt-6 font-sans text-sm tracking-wide text-neutral-300 md:text-base">
    Filmmaker. Site coming soon.
  </p>
</div>
