# CLAUDE.md

## What this project does

`check-package-dependencies` validates `package.json` files for dependency issues. It provides:

- An **ESLint plugin** (`eslint-plugin-check-package-dependencies`) with rules for inline linting — the whole feature set
- A **CLI** (`npx check-package-dependencies`) that runs the plugin's `recommended` config through ESLint, for a setup-free check

The programmatic API (`createCheckPackage`, `createCheckPackageWithWorkspaces`) was removed in v13.

## Commands

```sh
pnpm build          # compile with rollup + tsc
pnpm test           # run all tests (uses Node built-in test runner, TZ=UTC)
pnpm test:coverage  # coverage via c8
pnpm lint           # format + tsc + eslint
pnpm lint:eslint:package.json   # lint the repo's own package.json with the plugin
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
    messages.ts               # message fragments shared by the checks (fromDependency, inDependency)
  utils/                      # semver helpers, package.json parsing, etc.
    library.ts                # the "library" setting: type, detection, resolution
  cli.ts                      # CLI implementation (main, parseCliArgs, resolvePackageJsonPaths)
  eslint-plugin.ts            # ESLint plugin export, also the package root export
  test-setup.ts               # Node test runner setup (TypeScript loader)
bin/
  check-package-dependencies.mjs   # CLI entry point, a shim calling dist/cli-node.mjs
scripts/
  generate-rules-docs.js      # generates the rules documentation headers and the README rules table
documentation/
  rules/                      # one markdown file per ESLint rule
```

## Key concepts

### CLI

`src/cli.ts` drives the plugin through ESLint's own `ESLint` class: it resolves the package.json files to lint (`resolvePackageJsonPaths`: the target directory's, plus every workspace member's, as most rules check the linted file itself), lints them with `overrideConfigFile: true` and `overrideConfig: [configs.recommended]` so the linted project's `eslint.config.js` is irrelevant, then prints an ESLint formatter's output. `eslint` stays an optional peer dependency, dynamically imported with an actionable error when missing.

The module has no side effect: `bin/check-package-dependencies.mjs` calls the exported `main(process.argv.slice(2))`. It is built as its own rollup entry (`dist/cli-node.mjs`), which re-bundles the plugin.

Anything the CLI reports comes from `configs.recommended`, so changing that config changes the CLI.

### ESLint plugin

The plugin defines a custom `package-json` language (see `src/eslint/language.ts`) so ESLint can lint `package.json` files. Rules are created with `createPackageRule` which handles parsing, node traversal, and the `onlyWarnsFor` option consistently.

Each rule declares `docs` (description, `recommended`), and `fixable` / `hasSuggestions` when it reports fixes or suggestions. Every rule has a documentation file in `documentation/rules/` and a row in the README rules table — see the `eslint-rule-docs` skill when adding or changing a rule.

A fix can only edit the linted file, so a rule comparing two `package.json` files must report on the file it can fix. `consistent-workspace-dependencies` lints every `package.json` of the workspace and compares it with all the others, each conflict being owned by exactly one of the two packages — the one whose range has to be raised, or for a conflict with no range to raise (invalid range, npm alias of another package) the one `ownsUnorderedConflicts` is true for, never the workspace root. `checkDuplicateDependencies` implements that through its `conflictOwnership` param, which the legacy API leaves unset: having no file to fix, it keeps reporting every conflict it finds.

ESLint configs exported: `base` (language + plugin, no rules enabled) and `recommended` (10 of the 18 rules). There is no library config — see the `library` setting below. The 8 remaining rules (`require-identical-versions*`, `satisfies-versions*`) are opt-in, as they only make sense with options.

#### `meta.languages` and `meta.namespace`

`createPackageRule` sets `meta.languages: ["check-package-dependencies/package-json"]` on every rule, so ESLint throws `rule-unsupported-language` when one is enabled on a config entry linting another language, rather than the rule silently never running.

ESLint matches that entry against the plugin key the config's `language` comes from, plus the language plugin's `meta.namespace`. A config free to register the plugin under any key — `src/eslint/eslint.testUtils.ts`, the fixture tests, a user's `eslint.config.js` — only keeps working because the plugin declares `meta.namespace: "check-package-dependencies"`. Never drop it. The one case it cannot cover is a third-party plugin re-exporting `PackageJSONLanguage` under its own name: `meta.languages` has no cross-plugin wildcard, only `"*"` and `"plugin/*"`.

`pluginNamespace`, `packageJsonLanguageName` and `packageJsonLanguageId` in `src/eslint/language.ts` are the single source for those strings — including the `settings` key, which is the namespace and not the plugin key the config chose.

### `library` setting

Whether a package is published and consumed by other packages, which changes what is expected of its `dependencies` and `peerDependencies`. `src/utils/library.ts` holds it:

- `LibrarySetting` is `boolean | "auto" | string[]`, the array being package name patterns (`*` wildcard, `!` exclusion, last match wins).
- `detectIsLibrary(pkg)` implements `"auto"`, the default: a workspace root or a `private` package is not a library, anything else is.
- `resolveIsLibrary(setting, pkg)` resolves it **for a given package**, which is what lets a single config classify every package of a workspace.
- `legacyIsLibrarySettingMessage` is reported once per `package.json` by `createPackageRule` when the pre-v12 `isLibrary` **setting** is used (deduplicated with a `WeakSet` on the ast node, so enabling ten rules does not repeat it ten times).

Rules receive the resolved boolean as `isLibrary`, resolved for the linted `package.json`. Only `require-pinned-versions` branches on it today, skipping the `dependencies` field for a library; the two `min-range-*` rules deliberately do not, a range whose minimum does not satisfy the development version being wrong either way.

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

Add one **only to validate a real case against a real install** — a real `pnpm-lock.yaml` and real `node_modules`, where what is under test is the resolution itself. If the fixture would carry nothing but `package.json` files, it should have been a mock: the check only reads declared ranges, so the directory buys nothing over inline objects. Every remaining fixture has a committed lockfile and installs it in a `before()` hook; a new one without them does not belong here.

In order of preference:

1. **Call the check directly** with `parsePkgValue({...})` and `createMockReportError()`. Most behaviour lives in `src/checks/` and needs nothing else — this is where a new case belongs unless it is specifically about rule wiring.
2. **`RuleTester`** with inline `package.json` contents, in a `*.ruletester.test.ts` file. For a rule that reads nothing but the linted `package.json` and its options.
3. **The `src/eslint/eslint.testUtils.ts` helpers** when the rule needs to read other `package.json` files — a workspace root, its members, or a dependency's own manifest. `mockFileSystem(files)` replaces the `globSync` / `accessSync` / `readFileSync` calls the rules make with an in-memory set of files, and **throws** on any path it does not know so an unexpected disk read fails loudly. `lintPackageJson` / `lintPackageJsonMessages` / `fixPackageJson` lint one of those files through `Linter.verify`, which never touches the disk. Always `mock.restoreAll()` in an `afterEach`. See `consistent-workspace-dependencies.npm-alias.test.ts` and `require-workspace-protocol.test.ts`.
4. **A fixture directory** only when the check resolves real packages out of `node_modules`, with the lockfile and the install to back it — mocking that would only assert the mock. `fixtures/invalid-workspace-dependencies` is the example: it commits a `pnpm-lock.yaml` and its test installs it in a `before()` hook.

The mocked filesystem is mounted on the current working directory, because the tests declare their files relative to it and `mockFileSystem` resolves them with `path.resolve`. `loadWorkspacePackageJsons` and `findWorkspaceMemberNames` resolve their glob matches against the linted `package.json`, so a test linting `package.json` at the root of the mocked filesystem gets the same paths either way. `node --test` runs each file in its own process, so mutating `node:fs` with `mock.method` is safe.

### `onlyWarnsFor`

Most rules accept an `onlyWarnsFor` option that downgrades specific errors to warnings. `createPackageRule` tracks which entries were actually used and reports unused `onlyWarnsFor` entries as errors (`checkOnlyWarnsForArray` / `checkOnlyWarnsForMapping`).

A downgraded message is `console.warn`ed by `createPackageRule` instead of going through `context.report`, so it reaches neither ESLint's formatter, nor `--quiet`, nor the exit code.

## Build outputs

Rollup produces two ESM bundles in `dist/`:

- `dist/eslint-plugin-node.mjs` — ESLint plugin, exported both as the package root and as `./eslint-plugin`
- `dist/cli-node.mjs` — CLI, called by `bin/check-package-dependencies.mjs`

TypeScript declarations are emitted alongside via `tsc -p tsconfig.json`.
