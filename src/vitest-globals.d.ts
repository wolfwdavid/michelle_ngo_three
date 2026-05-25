// Augment Vitest's Assertion interface with @testing-library/jest-dom matchers
// (toBeInTheDocument, toHaveTextContent, etc.). The matchers themselves are
// wired at runtime by `vitest-setup-ui.ts` via
// `import '@testing-library/jest-dom/vitest'`; this file just makes
// TypeScript / svelte-check aware of the type augmentation so .test.ts files
// compile under strict mode.
//
// Plan 01-03 deviation (Rule 3 - blocking fix): the jest-dom package ships
// type defs that depend on `@types/jest` for the Jest-style augmentation
// path. We deliberately avoid the `/// <reference types="@testing-library/jest-dom" />`
// triple-slash here because it pulls in those Jest-shaped declarations and
// causes svelte-check to error with "Cannot find type definition file for 'jest'".
// The narrower module augmentation below targets ONLY Vitest's Assertion +
// AsymmetricMatchersContaining interfaces, which is what we actually need.

import 'vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // Vitest's base Assertion uses `T = any` (see @vitest/expect dist/index.d.ts);
  // match that exactly so module augmentation doesn't fail with "All declarations
  // of 'Assertion' must have identical type parameters".
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Assertion<T = any> extends TestingLibraryMatchers<unknown, T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining
    extends TestingLibraryMatchers<unknown, unknown> {}
}
