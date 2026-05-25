/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom doesn't implement IntersectionObserver. Provide a minimal mock
// so any code that touches the API (including the runed wrapper smoke
// test) doesn't blow up at import time. The mock is intentionally inert
// — tests that want real IO behavior run via Playwright e2e (Task 3).
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
// Cast through unknown to satisfy noUncheckedIndexedAccess + strict.
(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
  IntersectionObserverMock as unknown as typeof IntersectionObserver;
