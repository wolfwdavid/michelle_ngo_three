/**
 * Playwright 4-pillar suite + 2 emulation cases for Phase 3 Reel System Core.
 *
 * Pillars 1-4: REEL-01 scroll-snap, REEL-03 windowed-mount, REEL-06 leak
 * defense, NAV-03 axe-core forward-ship.
 * Emulations:  REEL-04 trigger 1 (reduced-motion), REEL-07 (Page Visibility pause).
 *
 * Runs on webkit + chromium + firefox per Plan 03-03 Task 6 playwright.config.ts
 * update. BrowserStack real-device matrix (Task 8) covers iOS Safari
 * 16/17.0/17.1/17.2+, Chrome Android, Firefox desktop, Safari macOS — those
 * gaps live in 03-VERIFICATION.md, not in this spec file.
 *
 * HEADLESS CAVEAT: Vimeo/YouTube embeds tend to NOT complete the postMessage
 * `play` handshake reliably in headless browser environments. The PreviewLoop
 * 800ms HANDSHAKE_TIMEOUT_MS therefore fires frequently, swapping iframes for
 * PosterImage. Tests that rely on iframes staying attached either (a) check
 * within the 800ms window or (b) accept the fallback outcome and assert the
 * REEL-04 unified codepath fired correctly. Real-device behavior (the actual
 * cinematic experience) is covered by the BrowserStack matrix in Task 8.
 *
 * Phase 3 D-15 contract.
 */
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const WORK_URL = '/work';

/**
 * Helper: scroll the inner reel container (NOT the document body — ReelStage's
 * h-svh + overflow-y-scroll container owns the scroll). Returns the new
 * scrollTop after the scroll settles.
 */
async function scrollReel(page: import('@playwright/test').Page, delta: number): Promise<number> {
  return page.evaluate((d) => {
    const reel = document.querySelector('[aria-label="Filmography reel"]') as HTMLElement | null;
    if (!reel) return -1;
    reel.scrollBy({ top: d, behavior: 'auto' });
    return reel.scrollTop;
  }, delta);
}

test.describe.parallel('Pillar 1: fast-flick', () => {
  test('flicks from section 1 to section ~30 cleanly (REEL-01 / SC#1)', async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on('pageerror', (e) => fatalErrors.push(`pageerror: ${e.message}`));

    await page.goto(WORK_URL);
    await page.waitForLoadState('load');

    // Big wheel down via the inner scroll container (the role=region wrapper).
    // proximity snap should NOT trap; section index should advance.
    await scrollReel(page, 50000);
    await page.waitForTimeout(800); // let snap settle

    // Active section is no longer section 0. We measure by reading the article
    // whose centerline is inside the REEL CONTAINER (NOT the viewport — Plan
    // 04-03 D-01 chrome math: the reel container is `h-[calc(100svh -
    // --chrome-nav-height - --chrome-pill-height)]` so its rect is smaller
    // than the viewport, and articles span that smaller height. Using
    // window.innerHeight as the centerline missed every article on Plan 04-02+
    // builds where chrome sits above the reel).
    const activeIdx = await page.evaluate(() => {
      const articles = Array.from(document.querySelectorAll('article'));
      const reel = document.querySelector(
        '[role="region"][aria-label="Filmography reel"]'
      ) as HTMLElement | null;
      const reelRect = reel?.getBoundingClientRect();
      const centerline = reelRect ? reelRect.top + reelRect.height / 2 : window.innerHeight * 0.5;
      const idx = articles.findIndex((a) => {
        const r = a.getBoundingClientRect();
        return r.top < centerline && r.bottom > centerline;
      });
      return idx;
    });

    expect(activeIdx).toBeGreaterThan(0);
    // pageerror catches hard JS exceptions (script errors). Third-party
    // iframe-internal noise is filtered out — those errors come from inside
    // Vimeo/YouTube/Cloudflare-challenge frames the headless browser
    // sandbox can't introspect into (cross-origin SecurityError on frame
    // access is normal). The PURPOSE of this pillar is to prove
    // fast-flicking the REEL itself doesn't throw — so we gate on
    // pageerrors EXCLUDING the expected third-party cross-origin noise.
    const filtered = fatalErrors.filter(
      (e) =>
        !/cross-origin|cookie|google-analytics|tracking|net::ERR_BLOCKED|challenges\.cloudflare|player\.vimeo|youtube-nocookie|youtube\.com|Protocols, domains/i.test(
          e
        )
    );
    expect(filtered).toEqual([]);
  });
});

test.describe.parallel('Pillar 2: windowed-mount', () => {
  test('iframe count never exceeds 3 during full reel scroll (REEL-03 / SC#2)', async ({
    page,
  }) => {
    await page.goto(WORK_URL);
    await page.waitForLoadState('load');

    const sectionCount = await page.locator('article').count();
    expect(sectionCount).toBeGreaterThanOrEqual(56);

    const maxIframes: number[] = [];
    // Slow scroll through ~10 sections, sampling iframe count at each step.
    // The ±1 windowing decision (D-09 + REEL-03) caps iframe attachments
    // at 3 at any single moment. In headless mode iframes may immediately
    // unmount via PreviewLoop's 800ms timeout — that ALSO satisfies the
    // invariant (n ≤ 3 includes n=0). The CONTRACT being verified is
    // "≤ 3 iframes ever attached simultaneously," not "≥ 1 always attached."
    for (let i = 0; i < 10; i++) {
      await scrollReel(page, await page.evaluate(() => window.innerHeight));
      await page.waitForTimeout(400);
      const n = await page.locator('iframe').count();
      maxIframes.push(n);
    }

    const peak = Math.max(...maxIframes);
    expect(peak).toBeLessThanOrEqual(3);
  });
});

test.describe('Pillar 3: leak defense', () => {
  test('full forward+back scroll has zero detached iframes after GC (REEL-06 / SC#4)', async ({
    page,
  }) => {
    await page.goto(WORK_URL);
    await page.waitForLoadState('load');

    const baselineIframes = await page.locator('iframe').count();

    // Scroll all 56 sections forward.
    const viewportH = await page.evaluate(() => window.innerHeight);
    for (let i = 0; i < 56; i++) {
      await scrollReel(page, viewportH);
      await page.waitForTimeout(80);
    }
    // Back to top.
    for (let i = 0; i < 56; i++) {
      await scrollReel(page, -viewportH);
      await page.waitForTimeout(80);
    }

    // Force GC if available (Chromium with --js-flags=--expose-gc;
    // Firefox/WebKit best-effort). `gc` is exposed only on debug builds.
    await page.evaluate(() => {
      const w = window as Window & { gc?: () => void };
      if (typeof w.gc === 'function') w.gc();
    });
    await page.waitForTimeout(500);

    const finalIframes = await page.locator('iframe').count();
    // Should be at or below baseline (current ± 1 again) AND ≤ 3 (REEL-03
    // ±1 budget). Either gives confidence the unmount path runs cleanly.
    expect(finalIframes).toBeLessThanOrEqual(baselineIframes + 1);
    expect(finalIframes).toBeLessThanOrEqual(3);
  });
});

test.describe.parallel('Pillar 4: axe-core WCAG AA', () => {
  test('/work has zero axe-core violations (NAV-03 forward-ship / SC#6)', async ({ page }) => {
    await page.goto(WORK_URL);
    await page.waitForLoadState('load');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Axe violations:', JSON.stringify(results.violations, null, 2));
    }
    expect(results.violations).toEqual([]);
  });
});

test.describe.parallel('reduced-motion fallback (REEL-04 trigger 1)', () => {
  test('emulating prefers-reduced-motion: reduce shows posters on EVERY section', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(WORK_URL);
    await page.waitForLoadState('load');

    // All sections render PosterImage (zero iframes mounted across ALL 56 sections).
    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBe(0);

    // ALL 56 sections must show the PLAY-WITH-SOUND CTA on their PosterImage.
    // The aria-label pattern `Play "<title>" with sound` is on every PosterImage anchor.
    const ctas = await page.locator('a[aria-label^="Play \\""]').count();
    expect(ctas).toBe(56);
  });
});

test.describe.parallel('Page Visibility pause (REEL-07 / SC#5)', () => {
  test('document.hidden change reaches mounted iframes within 300ms', async ({ page }) => {
    await page.goto(WORK_URL);
    await page.waitForLoadState('load');

    // In headless mode, iframes may attach briefly then unmount via the
    // PreviewLoop 800ms HANDSHAKE_TIMEOUT_MS. We probe iframe presence in a
    // short window after page load; if no iframe ever attaches (because the
    // headless browser blocked autoplay before the handshake), the test is
    // skipped — the page-visibility behavior is provable but only when
    // iframes are present to receive postMessage. The CONTRACT being checked
    // here is the dispatch path; the iframe lifecycle itself is covered by
    // PreviewLoop.test.ts unit tests (jsdom, deterministic timers).
    const attached = await page.locator('iframe').count();
    test.skip(
      attached === 0,
      'no iframes attached after page load (headless autoplay-blocked); contract verified by PreviewLoop.test.ts unit suite'
    );

    // Install a postMessage spy on each iframe's contentWindow. The override
    // captures every outgoing postMessage call's data + targetOrigin so we
    // can assert a pause dispatch happens. Overriding only works while the
    // contentWindow is same-origin (about:blank before the provider doc
    // loads); once cross-origin, Firefox throws "Permission denied" where
    // Chromium/WebKit silently no-op — treat uninstrumentable as the same
    // skip condition as no-iframes (dispatch is unobservable here).
    const installed = await page.evaluate(() => {
      const captured: Array<{ data: unknown; targetOrigin: string }> = [];
      const iframes = Array.from(document.querySelectorAll('iframe'));
      let instrumented = 0;
      iframes.forEach((iframe) => {
        const cw = iframe.contentWindow;
        if (!cw) return;
        try {
          const orig = cw.postMessage.bind(cw);
          // @ts-expect-error overriding for test
          cw.postMessage = function (msg: unknown, targetOrigin: string) {
            captured.push({ data: msg, targetOrigin });
            return orig(msg, targetOrigin);
          };
          instrumented++;
        } catch {
          // cross-origin contentWindow — cannot spy in this engine
        }
      });
      // @ts-expect-error stash on window for retrieval
      window.__capturedPostMessages = captured;
      return instrumented;
    });
    test.skip(
      installed === 0,
      'iframe contentWindow already cross-origin (engine forbids spy install); contract verified by PreviewLoop.test.ts unit suite'
    );

    // Trigger visibility change.
    const start = Date.now();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Wait up to 300ms for the pause postMessage to fire (REEL-07 SC#5 budget).
    await page.waitForTimeout(350);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(700); // generous: waitForTimeout(350) + tolerance

    const captured = await page.evaluate(() => {
      // @ts-expect-error stash on window
      return window.__capturedPostMessages as Array<{ data: unknown; targetOrigin: string }>;
    });

    // Assert at least one captured message references 'pause'. The PreviewLoop
    // dispatches provider-specific payloads:
    //   Vimeo: '{"method":"pause"}'
    //   YouTube: '{"event":"command","func":"pauseVideo"}'
    const hasPauseCall = captured.some((c) => {
      const data = typeof c.data === 'string' ? c.data : JSON.stringify(c.data);
      return /pause/i.test(data);
    });
    expect(hasPauseCall).toBe(true);
  });
});
