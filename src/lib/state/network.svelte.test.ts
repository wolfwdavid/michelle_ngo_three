import { describe, test, expect, afterEach, vi } from 'vitest';
import { network, initNetworkState, __resetNetworkStateForTests } from './network.svelte';

/**
 * network.svelte.ts — module-scope rune for Network Information API
 * (REEL-04 trigger 2, D-05, D-08, Pitfall 4).
 *
 * D-05: outside Chromium where navigator.connection is undefined,
 * isCellularLike returns false (Safari/Firefox progressive enhancement).
 */
describe('network.svelte (D-08 trigger 2: cellular-on-Chromium + saveData)', () => {
  afterEach(() => {
    __resetNetworkStateForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    // Remove any test-injected navigator.connection.
    delete (navigator as Navigator & { connection?: unknown }).connection;
  });

  test('default effectiveType is "unknown", saveData false, downlink null (SSR defaults)', () => {
    expect(network.effectiveType).toBe('unknown');
    expect(network.saveData).toBe(false);
    expect(network.downlink).toBe(null);
  });

  test('isCellularLike is false at defaults (autoplay-by-default outside Chromium, D-05)', () => {
    expect(network.isCellularLike).toBe(false);
  });

  test('isCellularLike is false when navigator.connection is undefined (Safari/Firefox)', () => {
    // navigator.connection is not present in jsdom by default.
    delete (navigator as Navigator & { connection?: unknown }).connection;
    initNetworkState();
    expect(network.isCellularLike).toBe(false);
  });

  test('initNetworkState no-ops when window is undefined (SSR)', () => {
    vi.stubGlobal('window', undefined);
    expect(() => initNetworkState()).not.toThrow();
    expect(network.isCellularLike).toBe(false);
  });

  test('isCellularLike is true when saveData=true', () => {
    (navigator as Navigator & { connection?: unknown }).connection = {
      saveData: true,
      addEventListener: vi.fn(),
    };
    const cleanup = $effect.root(() => {
      initNetworkState();
      expect(network.saveData).toBe(true);
      expect(network.isCellularLike).toBe(true);
    });
    cleanup();
  });

  test.each([['slow-2g'], ['2g'], ['3g']])(
    'isCellularLike is true when effectiveType is "%s"',
    (et) => {
      (navigator as Navigator & { connection?: unknown }).connection = {
        effectiveType: et,
        addEventListener: vi.fn(),
      };
      const cleanup = $effect.root(() => {
        initNetworkState();
        expect(network.effectiveType).toBe(et);
        expect(network.isCellularLike).toBe(true);
      });
      cleanup();
    }
  );

  test('isCellularLike is true when downlink < 1.5 (throttled hotel wifi, Pitfall 4)', () => {
    (navigator as Navigator & { connection?: unknown }).connection = {
      downlink: 0.5,
      effectiveType: '4g',
      addEventListener: vi.fn(),
    };
    const cleanup = $effect.root(() => {
      initNetworkState();
      expect(network.downlink).toBe(0.5);
      expect(network.isCellularLike).toBe(true);
    });
    cleanup();
  });

  test('isCellularLike is false when effectiveType="4g" and downlink>=1.5 and saveData=false', () => {
    (navigator as Navigator & { connection?: unknown }).connection = {
      effectiveType: '4g',
      downlink: 10,
      saveData: false,
      addEventListener: vi.fn(),
    };
    const cleanup = $effect.root(() => {
      initNetworkState();
      expect(network.effectiveType).toBe('4g');
      expect(network.isCellularLike).toBe(false);
    });
    cleanup();
  });

  test('initNetworkState is idempotent (connection.addEventListener called only once)', () => {
    const addEventListener = vi.fn();
    (navigator as Navigator & { connection?: unknown }).connection = {
      effectiveType: '4g',
      addEventListener,
    };
    const cleanup = $effect.root(() => {
      initNetworkState();
      initNetworkState();
      initNetworkState();
      expect(addEventListener).toHaveBeenCalledTimes(1);
    });
    cleanup();
  });

  test('change event re-applies network properties reactively', () => {
    let capturedHandler: (() => void) | null = null;
    const conn: Record<string, unknown> = {
      effectiveType: '4g',
      saveData: false,
      addEventListener: vi.fn((evt: string, h: () => void) => {
        if (evt === 'change') capturedHandler = h;
      }),
    };
    (navigator as Navigator & { connection?: unknown }).connection = conn;
    const cleanup = $effect.root(() => {
      initNetworkState();
      expect(network.isCellularLike).toBe(false);
      // Simulate the user enabling Data Saver.
      conn.saveData = true;
      expect(capturedHandler).not.toBeNull();
      capturedHandler?.();
      expect(network.saveData).toBe(true);
      expect(network.isCellularLike).toBe(true);
    });
    cleanup();
  });
});
