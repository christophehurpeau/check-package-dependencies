# CLAUDE.md

## What this project does

`check-package-dependencies` is a Node.js library that validates `package.json` files for dependency issues. It provides:

- A legacy **programmatic JavaScript API** for running checks as part of a script — `createCheckPackage` for a single package, or `createCheckPackageWithWorkspaces` for a monorepo root (pnpm workspaces)
- An **ESLint plugin** (`eslint-plugin-check-package-dependencies`) with rules for inline linting
- A **CLI** (`npx check-package-dependencies`) for quick validation

## Commands

```sh
pnpm build          # compile with rollup + tsc
pnpm test           # run all tests (uses Node built-in test runner, TZ=UTC)
pnpm test:coverage  # coverage via c8
pnpm lint           # format + tsc + eslint
pnpm checks         # run the repo's own check-package script (scripts/check-package.js)
pnpm generate:rules-docs        # update the generated parts of the ESLint rules documentation
pnpm generate:rules-docs:check  # fail if they are out of date (also covered by a test)
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
    library.ts                # the "library" setting/option: type, detection, resolution
  check-package.ts            # CheckPackageApi factory (createCheckPackage)
  check-package-with-workspaces.ts
  eslint-plugin.ts            # ESLint plugin export
  index.ts                    # public library entry point
  test-setup.ts               # Node test runner setup (TypeScript loader)
bin/
  check-package-dependencies.mjs   # CLI entry point
scripts/
  check-package.js            # example / self-check script
  generate-rules-docs.js      # generates the rules documentation headers and the README rules table
documentation/
  rules/                      # one markdown file per ESLint rule
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

`createCheckPackage` accepts the `library` option (see below), which also takes a `(pkg) => boolean` predicate here.

For workspaces, `createCheckPackageWithWorkspaces()` (see `check-package-with-workspaces.ts`) returns a `CheckPackageWithWorkspacesApi` that exposes only `checkRecommended`, `forRoot`, `forEach`, and `for(id, …)`. Its `library` option applies to the workspace members, the root always being checked as a non-library. Its `checkRecommended` runs the root `checkNoDependencies`, the root `checkRecommended`, then iterates each workspace package running their `checkRecommended` plus monorepo-wide duplicate-dependency and subpackage-peer-dependency checks. The corresponding ESLint rules are `no-root-workspace-dependencies` and `consistent-workspace-dependencies`.

### ESLint plugin

The plugin defines a custom `package-json` language (see `src/eslint/language.ts`) so ESLint can lint `package.json` files. Rules are created with `createPackageRule` which handles parsing, node traversal, and the `onlyWarnsFor` option consistently.

Each rule declares `docs` (description, `recommended`), and `fixable` / `hasSuggestions` when it reports fixes or suggestions. Every rule has a documentation file in `documentation/rules/` and a row in the README rules table — see the `eslint-rule-docs` skill when adding or changing a rule.

ESLint configs exported: `base` (language + plugin, no rules enabled) and `recommended` (10 of the 18 rules). There is no library config — see the `library` setting below. The 8 remaining rules (`require-identical-versions*`, `satisfies-versions*`) are opt-in, as they only make sense with options.

### `library` setting

Whether a package is published and consumed by other packages, which changes what is expected of its `dependencies` and `peerDependencies`. `src/utils/library.ts` holds it:

- `LibrarySetting` is `boolean | "auto" | string[]`, the array being package name patterns (`*` wildcard, `!` exclusion, last match wins).
- `detectIsLibrary(pkg)` implements `"auto"`, the default: a workspace root or a `private` package is not a library, anything else is.
- `resolveIsLibrary(setting, pkg)` resolves it **for a given package**, not for the linted file, which is what lets the root config classify workspace members.
- `assertNoLegacyIsLibraryOption(options)` throws for the pre-v12 `isLibrary` option; the ESLint setting of the same name is reported once per `package.json` by `createPackageRule` (deduplicated with a `WeakSet` on the ast node, so enabling ten rules does not repeat it ten times).

Rules receive the resolved boolean as `isLibrary`, and `checkPackage` rules also receive `isLibraryFor(pkg)` for other packages — used by `consistent-workspace-dependencies` for each workspace member. Only `require-pinned-versions` branches on it today, skipping the `dependencies` field for a library; the two `min-range-*` rules deliberately do not, a range whose minimum does not satisfy the development version being wrong either way.

The legacy API mirrors this through `isPkgLibrary` and `shouldHaveExactVersions` in `check-package.ts` — keep both sides in sync.

#### Naming: never "library vs application"

The setting is a single boolean question, "is this package a library", and its false side has no name. A monorepo root is not a library, and it is not an application either; neither is a private package that only holds shared test config. Writing "application" for `library: false` invents a category the code does not have, and misleads whoever reads it into thinking a third case exists or that roots are excluded.

In documentation, comments and messages, say "a library" and "a package that is not a library", or use the setting values directly — the rule documentation tables are headed `library: false` / `library: true` for that reason.

### Test utilities

Tests use Node's built-in `node:test` / `node:assert/strict`. The shared helpers in `src/reporting/ReportError.testUtils.ts` provide:

- `createMockReportError()` — returns `{ mockReportError, messages }`
- `assertNoMessages(messages)`
- `assertSingleMessage(messages, expected)`
- `assertSeveralMessages(messages, expected[])`

#### Do not add fixtures — mock instead

Avoid `fixtures/` most of the time. They put the interesting part of the test in a separate file the reader has to open, they cannot express several cases without several directories, and they cost a `pnpm install --frozen-lockfile` on every run.

Add one **only to validate a real case against a real install** — a real `pnpm-lock.yaml` and real `node_modules`, where what is under test is the resolution itself. If the fixture would carry nothing but `package.json` files, it should have been a mock: the check only reads declared ranges, so the directory buys nothing over inline objects. Several existing fixtures are in exactly that state (`workspace-dependencies-library`, `invalid-workspace-protocol`, …) — they predate this rule and are not a precedent.

In order of preference:

1. **Call the check directly** with `parsePkgValue({...})` and `createMockReportError()`. Most behaviour lives in `src/checks/` and needs nothing else — this is where a new case belongs unless it is specifically about rule wiring.
2. **`RuleTester`** with inline `package.json` contents, in a `*.ruletester.test.ts` file.
3. **`Linter.verify(code, [config], filename)`** when the rule needs to read other `package.json` files. The `package-json` language parses `file.body` as a string, so the linted file never has to exist. Mock the reads with `mock.method` from `node:test`, and make the mock **throw** on any path it does not know so an unexpected disk read fails loudly. See `consistent-workspace-dependencies.npm-alias.test.ts`, which mocks the `globSync` / `accessSync` / `readFileSync` calls of `loadWorkspacePackageJsons` and declares its workspace members as inline objects.
4. **A fixture directory** only when the check resolves real packages out of `node_modules`, with the lockfile and the install to back it — mocking that would only assert the mock. `fixtures/invalid-workspace-dependencies` is the example: it commits a `pnpm-lock.yaml` and its test installs it in a `before()` hook.

`Linter` also avoids the `process.chdir` juggling the `ESLint`-class fixture tests need. `node --test` runs each file in its own process, so mutating `node:fs` with `mock.method` is safe, but still `mock.restoreAll()` in `afterEach`.

### `onlyWarnsFor`

Most checks accept an `onlyWarnsFor` option that downgrades specific errors to warnings. The library tracks which entries were actually used and reports unused `onlyWarnsFor` entries as errors.

## Build outputs

Rollup produces two ESM bundles in `dist/`:

- `dist/index-node.mjs` — programmatic API
- `dist/eslint-plugin-node.mjs` — ESLint plugin

TypeScript declarations are emitted alongside via `tsc -p tsconfig.json`.
