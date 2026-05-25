import { afterEach, describe, test, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import SmokePage from './smoke-page.svelte';

// @testing-library/svelte does NOT auto-cleanup between tests in Vitest 4
// (it relies on `globals: true` which we deliberately keep off — vite.config.ts
// `globals: false` is preserved verbatim from Plan 01-01). Without an explicit
// afterEach hook, the second test sees TWO `[data-testid="counter"]` buttons
// (Test A's leftover + Test B's freshly-rendered one) and getByTestId throws.
// Deviation: Plan 01-03 didn't anticipate this — Rule 1 bug fix.
afterEach(() => {
  cleanup();
});

describe('SmokePage component smoke (Phase 1 SC #4 unit gate)', () => {
  test('renders the greeting prop', () => {
    render(SmokePage, { greeting: 'phase one' });
    expect(screen.getByTestId('greeting')).toHaveTextContent('phase one');
  });

  test('button click increments the counter ($state rune reactivity)', async () => {
    render(SmokePage);
    const button = screen.getByTestId('counter');
    expect(button).toHaveTextContent('clicked 0');
    await fireEvent.click(button);
    expect(button).toHaveTextContent('clicked 1');
  });
});
