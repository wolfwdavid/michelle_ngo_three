/**
 * lint-staged config — invokes prettier and eslint via `node <absolute-path-to-cli.js>`
 * so child_process.spawn works on Windows under husky's pre-commit environment
 * (where node_modules/.bin is NOT in PATH and Node's spawn refuses to invoke
 * .CMD shims without shell:true).
 *
 * History: bare commands ("eslint --fix", "prettier --write") fail with ENOENT
 * on Windows under git's husky pre-commit shell environment. lint-staged v17
 * removed the --shell flag, so we resolve to the underlying JS entrypoints and
 * launch Node directly. `node` IS on PATH because nodejs install put it there.
 *
 * Affected by: Phase 3 first commit attempt (Plan 03-01 Task 1). Phase 1/2
 * commits likely worked from a different shell env that exported the bin path.
 */
const path = require('path');

const prettierBin = path.resolve(__dirname, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
const eslintBin = path.resolve(__dirname, 'node_modules', 'eslint', 'bin', 'eslint.js');

module.exports = {
  '*.{js,ts,svelte}': [
    `node "${eslintBin}" --fix`,
    `node "${prettierBin}" --write`,
  ],
  '*.{css,json,md,yaml,yml}': [`node "${prettierBin}" --write`],
};
