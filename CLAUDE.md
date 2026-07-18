# CLAUDE.md

## What this project does

`check-package-dependencies` is a Node.js library that validates `package.json` files for dependency issues. It provides:

- A legacy **programmatic JavaScript API** for running checks as part of a script — `createCheckPackage` for a single package, or `createCheckPackageWithWorkspaces` for a monorepo root (Yarn/npm workspaces)
- An **ESLint plugin** (`eslint-plugin-check-package-dependencies`) with rules for inline linting
- A **CLI** (`npx check-package-dependencies`) for quick validation

See [TODO.md](TODO.md) for the current migration status.

## Commands

```sh
yarn build          # compile with rollup + tsc
yarn test           # run all tests (uses Node built-in test runner, TZ=UTC)
yarn test:coverage  # coverage via c8
yarn lint           # format + tsc + eslint
yarn checks         # run the repo's own check-package script (scripts/check-package.js)
```

## Project structure

```
src/
  checks/                     # core check implementations
  eslint/
    rules/                    # ESLint rule implementations
    create-rule/              # rule factory (createPackageRule)
    language.ts               # custom ESLint language for package.json
    source-code.ts            # AST / source utilities
    rules.ts                  # rule registry
  reporting/
    ReportError.ts            # ReportError interface
    ReportError.testUtils.ts  # test helpers (createMockReportError, assertSingleMessage, …)
    cliErrorReporting.ts      # CLI error formatting
  utils/                      # semver helpers, package.json parsing, etc.
  check-package.ts            # CheckPackageApi factory (createCheckPackage)
  check-package-with-workspaces.ts
  eslint-plugin.ts            # ESLint plugin export
  index.ts                    # public library entry point
  test-setup.ts               # Node test runner setup (TypeScript loader)
bin/
  check-package-dependencies.mjs   # CLI entry point
scripts/
  check-package.js            # example / self-check script
```

## Key concepts

### Programmatic API

`createCheckPackage()` returns a fluent `CheckPackageApi`. Checks are chained and evaluated when `.run()` (async) or `.runSync()` is called. Pass `--fix` on the CLI to enable auto-fix.

```js
import { createCheckPackage } from "check-package-dependencies";

await createCheckPackage()
  .checkRecommended() // shorthand for the most common checks
  .run();
```

For Yarn/npm workspaces, `createCheckPackageWithWorkspaces()` (see `check-package-with-workspaces.ts`) returns a `CheckPackageWithWorkspacesApi` that exposes only `checkRecommended`, `forRoot`, `forEach`, and `for(id, …)`. Its `checkRecommended` runs the root `checkNoDependencies`, the root `checkRecommended`, then iterates each workspace package running their `checkRecommended` plus monorepo-wide duplicate-dependency and subpackage-peer-dependency checks. The corresponding ESLint rules are `no-root-workspace-dependencies` and `consistent-workspace-dependencies`.

### ESLint plugin

The plugin defines a custom `package-json` language (see `src/eslint/language.ts`) so ESLint can lint `package.json` files. Rules are created with `createPackageRule` which handles parsing, node traversal, and the `onlyWarnsFor` option consistently.

ESLint configs exported: `base` (language + plugin, no rules enabled), `recommended` (7 rules — same set as `recommended-library` minus the two `min-range-*` rules), `recommended-library` (9 rules — adds the two `min-range-*` rules and sets `require-exact-versions` with `dependencies: false`). The remaining 3 rules (`satisfies-versions`, `satisfies-versions-between-dependencies`, `satisfies-versions-from-dependencies`) are opt-in.

### Test utilities

Tests use Node's built-in `node:test` / `node:assert/strict`. The shared helpers in `src/reporting/ReportError.testUtils.ts` provide:

- `createMockReportError()` — returns `{ mockReportError, messages }`
- `assertNoMessages(messages)`
- `assertSingleMessage(messages, expected)`
- `assertSeveralMessages(messages, expected[])`

### `onlyWarnsFor`

Most checks accept an `onlyWarnsFor` option that downgrades specific errors to warnings. The library tracks which entries were actually used and reports unused `onlyWarnsFor` entries as errors.

## Build outputs

Rollup produces two ESM bundles in `dist/`:

- `dist/index-node.mjs` — programmatic API
- `dist/eslint-plugin-node.mjs` — ESLint plugin

TypeScript declarations are emitted alongside via `tsc -p tsconfig.json`.
