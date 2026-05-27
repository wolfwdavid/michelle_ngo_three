/**
 * Deferred-mount factory for hero ambient iframes (Phase 5 D-03).
 *
 * On `start()`, the factory races three triggers:
 *   1. requestIdleCallback({ timeout: 1000 }) — fires when the browser is idle
 *      (Chromium/Firefox). Safari lacks rIC, so it's skipped via the typeof
 *      guard; setTimeout below is the load-bearing fallback for that engine.
 *   2. setTimeout(1000) — GUARANTEES the iframe mounts even if the browser
 *      never goes idle. Safari fallback + idle-starved-tab insurance.
 *   3. First user interaction on window: pointerdown | wheel | touchstart |
 *      scroll. Whichever fires first via `{ once: true, passive: true }`
 *      listeners (passive so the listener cannot block scroll on touchstart/
 *      wheel — load-bearing for the cinematic-scroll-into-reel UX).
 *
 * Whichever wins, `shouldMount` flips to `true` (one-shot latch — never flips
 * back within an instance). All other triggers are cleaned up (timers cleared,
 * listeners removed).
 *
 * Why a factory (not a module-scope singleton):
 *   Phase 6 ABT-01 /about page will instantiate ANOTHER hero ambient bg loop.
 *   If a producer navigates from `/` → `/about` without a full page reload
 *   (SPA client-side nav), two HeroAmbient-style instances may coexist briefly
 *   during the transition. A module-scope singleton would tangle their timers
 *   and event listeners. A factory gives each surface its own clean instance.
 *
 * SSR-safe:
 *   - start() guards `typeof window === 'undefined'` and is a no-op during
 *     prerender — `shouldMount` stays false through SSR.
 *   - dispose() is idempotent; calling it twice is a no-op.
 *
 * Usage from HeroAmbient.svelte / future /about ambient bg:
 *
 *   const defer = createHeroDefer();
 *   $effect(() => {
 *     defer.start();
 *     return () => defer.dispose();
 *   });
 *   const mountIframe = $derived(defer.shouldMount && isOnScreen && !shouldShowPoster);
 */

export type HeroDefer = {
  readonly shouldMount: boolean;
  start: () => void;
  dispose: () => void;
};

export function createHeroDefer(): HeroDefer {
  let _shouldMount = $state(false);
  let started = false;
  let disposed = false;
  let ricId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const cleanups: Array<() => void> = [];

  function fire(): void {
    if (_shouldMount || disposed) return;
    _shouldMount = true;
    cleanup();
  }

  function cleanup(): void {
    if (ricId !== null && typeof cancelIdleCallback === 'function') {
      cancelIdleCallback(ricId);
      ricId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    for (const c of cleanups) c();
    cleanups.length = 0;
  }

  return {
    get shouldMount(): boolean {
      return _shouldMount;
    },
    start(): void {
      if (started || disposed) return;
      started = true;
      // SSR guard — prerender has no window; shouldMount stays false.
      if (typeof window === 'undefined') return;

      // Trigger 1: requestIdleCallback (Chromium/Firefox; absent on Safari).
      if (typeof requestIdleCallback === 'function') {
        ricId = requestIdleCallback(() => fire(), { timeout: 1000 });
      }

      // Trigger 2: setTimeout(1000) — Safari fallback + idle-starved-tab insurance.
      timeoutId = setTimeout(() => fire(), 1000);

      // Trigger 3: first user interaction. Named handler so removeEventListener
      // can take it back (anonymous closures would leak per Phase 3 Layer 4).
      const handler = (): void => fire();
      const events = ['pointerdown', 'wheel', 'touchstart', 'scroll'] as const;
      for (const ev of events) {
        // { once: true } auto-removes after first fire; { passive: true } so
        // the listener cannot preventDefault() on touchstart/wheel/scroll —
        // load-bearing for the cinematic-scroll-into-reel UX.
        window.addEventListener(ev, handler, { once: true, passive: true });
        cleanups.push(() => window.removeEventListener(ev, handler));
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      cleanup();
    },
  };
}
