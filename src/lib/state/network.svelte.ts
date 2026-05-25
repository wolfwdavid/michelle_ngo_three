/**
 * Module-scope rune for Network Information API + saveData + downlink (REEL-04
 * fallback trigger 2, D-05, D-08, Pitfall 4).
 *
 * D-05 (PROGRESSIVE ENHANCEMENT): outside Chromium where navigator.connection
 * is undefined, isCellularLike returns false (autoplay-by-default for Safari/
 * Firefox/iOS Safari). The "default to fast" choice is deliberate — Safari/
 * Firefox users are the majority of mobile filmmaker-portfolio audience;
 * defaulting to poster would defeat the cinema-mode design.
 *
 * STATE.md blocker #1 (REEL-04 Chromium-only ambiguity) — RESOLVED here.
 *
 * Same .svelte.ts extension + __isBrowser() idiom as $lib/storage.ts.
 */
import { __isBrowser } from '$lib/storage';

type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface NavigatorConnection {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  addEventListener?: (type: 'change', listener: () => void) => void;
}

let _effectiveType = $state<EffectiveType>('unknown');
let _saveData = $state(false);
let _downlink = $state<number | null>(null);

export const network = {
  get effectiveType(): EffectiveType {
    return _effectiveType;
  },
  get saveData(): boolean {
    return _saveData;
  },
  get downlink(): number | null {
    return _downlink;
  },
  get isCellularLike(): boolean {
    // Pitfall 4 + D-05: poster mode triggered for Save-Data OR cellular
    // (effectiveType slow-2g/2g/3g) OR throttled wifi (downlink < 1.5 Mbps,
    // catches the hotel-wifi case). Outside Chromium where API is undefined,
    // all three remain at their SSR defaults → returns false (autoplay).
    if (_saveData) return true;
    if (_effectiveType === 'slow-2g' || _effectiveType === '2g' || _effectiveType === '3g')
      return true;
    if (_downlink !== null && _downlink < 1.5) return true;
    return false;
  },
};

let initialized = false;

/**
 * Test-only: reset the module-scope initialized flag + runes so successive
 * tests within the same module-load can re-run initNetworkState cleanly.
 * Production code MUST NOT call this.
 */
export function __resetNetworkStateForTests(): void {
  initialized = false;
  _effectiveType = 'unknown';
  _saveData = false;
  _downlink = null;
}

/**
 * Test-only: force isCellularLike via the underlying effectiveType. Plan 03-03
 * Task 2 ReelSection tests use this to assert the REEL-04 trigger-2 swap to
 * PosterImage without spinning up a navigator.connection mock. Always reset
 * via `__resetNetworkStateForTests` in afterEach.
 */
export function __setEffectiveTypeForTests(et: EffectiveType): void {
  _effectiveType = et;
}

/** Test-only: force saveData flag (REEL-04 trigger 2 via the saveData branch). */
export function __setSaveDataForTests(v: boolean): void {
  _saveData = v;
}

export function initNetworkState(): void {
  if (!__isBrowser() || initialized) return;
  initialized = true;
  const conn = (navigator as Navigator & { connection?: NavigatorConnection }).connection;
  if (!conn) return; // D-05: Safari/Firefox 2026 → defaults stay → autoplay-by-default
  const apply = (): void => {
    const et = conn.effectiveType;
    _effectiveType = et === 'slow-2g' || et === '2g' || et === '3g' || et === '4g' ? et : 'unknown';
    _saveData = conn.saveData ?? false;
    _downlink = typeof conn.downlink === 'number' ? conn.downlink : null;
  };
  apply();
  conn.addEventListener?.('change', apply);
}
