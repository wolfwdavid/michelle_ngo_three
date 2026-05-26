/**
 * Module-scope rune for mobile-menu open state (Phase 4 D-08).
 *
 * Plan 04-02 ships this rune + the openMenu/closeMenu helpers; Plan 04-03
 * extends ReelStage.svelte to OR menu.menuOpen with document.hidden in its
 * documentHidden $state so the existing reel:visibility context broadcast
 * (Phase 3 D-12) pauses every within-window PreviewLoop within 300ms when
 * the menu opens — reuses the 5-layer leak defense plumbing instead of
 * building a parallel pause mechanism.
 *
 * SSR-safe: _menuOpen defaults to false; mobile menu can't be open during
 * prerender so this is correct by construction.
 */
let _menuOpen = $state(false);

export const menu = {
  get menuOpen(): boolean {
    return _menuOpen;
  },
};

export function openMenu(): void {
  _menuOpen = true;
}

export function closeMenu(): void {
  _menuOpen = false;
}

/** Test-only. Resets module-scope state for fresh per-test runs. */
export function __resetMenuStateForTests(): void {
  _menuOpen = false;
}
