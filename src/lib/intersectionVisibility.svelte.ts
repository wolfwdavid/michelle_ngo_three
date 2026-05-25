/**
 * Phase 1 SC #4 smoke: prove that `runed`'s rune-native IntersectionObserver
 * helper is wired and exercised on day one. Phase 3 ReelStage replaces this
 * with a viewport-windowed-mount controller; this file's lifetime is just
 * "until Phase 3 lands the real version."
 *
 * Why a class with a getter (not a plain function): `useIntersectionObserver`
 * needs to live inside a $effect-friendly scope; wrapping in a class lets
 * callers do `const v = new IntersectionVisibility(() => el); $effect(() => console.log(v.isVisible));`
 * with auto-cleanup via the class's $state cleanup hook.
 *
 * **MUST be instantiated inside an `$effect.root(() => { ... })` block OR
 * inside a Svelte component's `<script>` context.** The class constructor
 * internally calls `useIntersectionObserver` from `runed`, which itself
 * registers a `$effect`. In Svelte 5.55+ that warns / throws when there is
 * no surrounding effect scope. Unit tests in
 * `intersectionVisibility.test.ts` ALL wrap construction in `$effect.root`.
 */
import { useIntersectionObserver, type UseIntersectionObserverOptions } from 'runed';

export class IntersectionVisibility {
  #isVisible = $state(false);

  constructor(
    target: () => HTMLElement | null | undefined,
    options?: UseIntersectionObserverOptions
  ) {
    // runed's MaybeGetter targets HTMLElement specifically (not the broader
    // Element interface) — typing the constructor parameter accordingly keeps
    // the wrapper honest under TS strict + the Phase 1 noUncheckedIndexedAccess
    // posture. The options type is runed's `UseIntersectionObserverOptions`
    // (an Omit<IntersectionObserverInit, "root"> + a root: MaybeElementGetter)
    // rather than the raw IntersectionObserverInit, because runed's root accepts
    // a getter while the DOM type expects a plain Element | Document.
    useIntersectionObserver(
      target,
      (entries) => {
        const entry = entries[0];
        if (entry !== undefined) this.#isVisible = entry.isIntersecting;
      },
      options
    );
  }

  get isVisible(): boolean {
    return this.#isVisible;
  }
}
