# TODO

> **Note for agents:** Update this file whenever you add or migrate a check. The ESLint migration column tracks whether a check has a corresponding ESLint rule in `src/eslint/rules/`. The unit test column tracks whether a dedicated test file exists in `src/checks/`.
>
> **API vs ESLint rule shape:** the two layers don't always map 1:1. The programmatic API checks operate holistically on a parsed `package.json` (and often on related packages loaded via `getDependencyPackageJson`), while ESLint rules are driven by per-node visitors (`checkDependencyValue`, `checkPackage`, …) on the `package-json` language AST. As a result:
>
> - One API check may be split across multiple rules (e.g. the `min-range-*` family is two rules; the workspace-related API logic is bundled into one `workspace-dependencies` rule).
> - One rule may cover several API checks at once (e.g. `workspace-dependencies` covers both `checkDuplicateDependencies` cross-checks and `checkMonorepoDirectSubpackagePeerDependencies`).
> - A rule can be a strict subset of its API equivalent (e.g. `root-workspace-should-not-have-dependencies` only handles the workspace-root case of `checkNoDependencies`; the `exact-versions` rule has no equivalent to `internalExactVersionsIgnore`).
> - Reporting granularity, options surface, and auto-fix behavior may differ even when the underlying check is the same — what matters for "migrated" is functional coverage, not call-for-call equivalence.

## Public API Checks (`CheckPackageApi`)

| Check method                                          | Core function                                       | ESLint rule                                                                                                 | Unit test                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `checkExactVersions`                                  | `checkExactVersions`                                | `exact-versions` ✅                                                                                         | `checkExactVersions.test.ts` ✅                                                                |
| `checkExactDevVersions`                               | `checkExactVersions` (devDeps only)                 | covered by `exact-versions` (partial) ⚠️                                                                    | covered by `checkExactVersions.test.ts` ⚠️                                                     |
| `checkResolutionsVersionsMatch`                       | `checkResolutionsVersionsMatch`                     | `resolutions-versions-match` ✅                                                                             | `checkResolutionsVersionsMatch.test.ts` ✅                                                     |
| `checkNoDependencies`                                 | `checkNoDependencies`                               | `root-workspace-should-not-have-dependencies` ⚠️ (workspace root only, via `check-package-with-workspaces`) | `checkNoDependencies.test.ts` ✅                                                               |
| `checkDirectPeerDependencies`                         | `checkDirectPeerDependencies`                       | `direct-peer-dependencies` ✅                                                                               | `checkDirectPeerDependencies.test.ts` ✅                                                       |
| `checkDirectDuplicateDependencies`                    | `checkDirectDuplicateDependencies`                  | `direct-duplicate-dependencies` ✅                                                                          | ❌ no test file                                                                                |
| `checkResolutionsHasExplanation`                      | `checkResolutionsHasExplanation`                    | `resolutions-has-explanation` ✅                                                                            | ❌ no test file                                                                                |
| `checkRecommended`                                    | meta-check (combines others)                        | N/A                                                                                                         | ❌ no test file                                                                                |
| `checkIdenticalVersionsThanDependency`                | `checkIdenticalVersionsThanDependency`              | `identical-versions-than-dependency` ✅                                                                     | `checkIdenticalVersionsThanDependency.test.ts` ✅                                              |
| `checkIdenticalVersionsThanDevDependencyOfDependency` | `checkIdenticalVersionsThanDependency` (on devDeps) | `identical-versions-than-dev-dependency-of-dependency` ✅                                                   | no dedicated unit test (core function is source-agnostic; ESLint rule has integration test) ⚠️ |
| `checkSatisfiesVersions`                              | `checkSatisfiesVersions`                            | `satisfies-version` ✅                                                                                      | `checkSatisfiesVersions.test.ts` ✅                                                            |
| `checkSatisfiesVersionsFromDependency`                | `checkSatisfiesVersionsFromDependency`              | `satisfies-versions-from-dependencies` ✅                                                                   | `checkSatisfiesVersionsFromDependency.test.ts` ✅                                              |
| `checkSatisfiesVersionsInDevDependenciesOfDependency` | `checkSatisfiesVersionsFromDependency` (on devDeps) | `satisfies-versions-from-dev-dependencies-of-dependency` ✅                                                 | ❌ no test file                                                                                |
| `checkIdenticalVersions`                              | `checkIdenticalVersions`                            | `identical-versions` ✅                                                                                     | `checkIdenticalVersions.test.ts` ✅                                                            |
| `checkSatisfiesVersionsBetweenDependencies`           | `checkSatisfiesVersionsBetweenDependencies`         | `satisfies-versions-between-dependencies` ✅                                                                | ❌ no dedicated test (ESLint rule has test)                                                    |
| `checkSatisfiesVersionsInDependency`                  | `checkSatisfiesVersionsInDependency`                | `satisfies-versions-in-dependency` ✅                                                                       | `checkSatisfiesVersionsInDependency.test.ts` ✅                                                |
| `checkMinRangeDependenciesSatisfiesDevDependencies`   | `checkMinRangeSatisfies` (deps→devDeps)             | `min-range-dependencies-satisfies-dev-dependencies` ✅                                                      | `checkMinRangeSatisfies.test.ts` ✅                                                            |
| `checkMinRangePeerDependenciesSatisfiesDependencies`  | `checkMinRangeSatisfies` (peer→deps)                | `min-range-peer-dependencies-satisfies-dependencies` ✅                                                     | covered by `checkMinRangeSatisfies.test.ts` ⚠️                                                 |

Legend: ✅ done · ⚠️ partial/shared · ❌ missing

## Recommended-checks coverage

What the programmatic `checkRecommended` actually runs vs. what the ESLint `recommended` / `recommended-library` configs enable.

### `CheckPackageApi.checkRecommended()` (`check-package.ts`)

Always runs:

| Programmatic call                  | ESLint rule                     | In ESLint `recommended` | In ESLint `recommended-library` |
| ---------------------------------- | ------------------------------- | ----------------------- | ------------------------------- |
| `checkExactVersions`               | `exact-versions`                | ✅                      | ✅ (`dependencies: false`)      |
| `checkResolutionsVersionsMatch`    | `resolutions-versions-match`    | ✅                      | ✅                              |
| `checkResolutionsHasExplanation`   | `resolutions-has-explanation`   | ✅                      | ✅                              |
| `checkDirectPeerDependencies`      | `direct-peer-dependencies`      | ✅                      | ✅                              |
| `checkDirectDuplicateDependencies` | `direct-duplicate-dependencies` | ✅                      | ✅                              |

When `isLibrary` is true, additionally runs:

| Programmatic call                                    | ESLint rule                                          | In ESLint `recommended` | In ESLint `recommended-library` |
| ---------------------------------------------------- | ---------------------------------------------------- | ----------------------- | ------------------------------- |
| `checkMinRangeDependenciesSatisfiesDevDependencies`  | `min-range-dependencies-satisfies-dev-dependencies`  | ❌                      | ✅                              |
| `checkMinRangePeerDependenciesSatisfiesDependencies` | `min-range-peer-dependencies-satisfies-dependencies` | ❌                      | ✅                              |

### `CheckPackageWithWorkspacesApi.checkRecommended()` (`check-package-with-workspaces.ts`)

Runs four phases. The root `CheckPackageApi` is always created with `isLibrary: false`; per-subpackage `isLibrary` is derived from each workspace's own `package.json`.

**Phase 1 — root `checkNoDependencies()`**

| Programmatic call               | ESLint rule                                   | In `recommended` | In `recommended-library` |
| ------------------------------- | --------------------------------------------- | ---------------- | ------------------------ |
| `checkNoDependencies()` on root | `root-workspace-should-not-have-dependencies` | ✅               | ✅                       |

**Phase 2 — root `checkRecommended()` (forced `isLibrary: false`)** — runs the 5 always-checks from `CheckPackageApi.checkRecommended()` above (no `min-range-*`). The matching ESLint config for the root is `recommended` (not `recommended-library`).

**Phase 3 — per-subpackage `checkRecommended()`** — runs the 5 always-checks; if the subpackage is a library, adds the 2 `min-range-*` checks. Each subpackage should be matched against `recommended` or `recommended-library` accordingly.

Subpackage `checkRecommended` also passes `internalExactVersionsIgnore: [...workspace package names]` so workspace-internal package names are skipped by `checkExactVersions`. **The `exact-versions` ESLint rule does not currently replicate this**: it has no option to ignore workspace package names. ⚠️ divergence — if a subpackage depends on another workspace package with a range like `^1.0.0`, the programmatic flow allows it while the ESLint rule will report it.

**Phase 4 — monorepo cross-checks**

| Programmatic call                                                                                                                  | ESLint rule                        | In `recommended` | In `recommended-library` |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------- | ------------------------ |
| `checkDuplicateDependencies` (root↔sub, sub↔sub for `dependencies`/`devDependencies`/`peerDependencies`)                           | `workspace-dependencies` (partial) | ✅               | ✅                       |
| `checkMonorepoDirectSubpackagePeerDependencies` → `checkSatisfiesPeerDependency` (sub's deps' peer deps satisfied by root devDeps) | `workspace-dependencies` (partial) | ✅               | ✅                       |

`workspace-dependencies` only fires on a `package.json` that has a `workspaces` field, so the cross-checks always run against the monorepo root.

### Summary

- Every check in the programmatic `CheckPackageApi.checkRecommended` has a corresponding ESLint rule, and the rule is enabled in the matching ESLint config (`recommended` for application packages, `recommended-library` for libraries).
- ESLint `recommended` does **not** enable the two `min-range-*` rules; those are only in `recommended-library`. This mirrors the `isLibrary` branch in the programmatic `checkRecommended`.
- Every check in the programmatic `CheckPackageWithWorkspacesApi.checkRecommended` has a corresponding ESLint rule. The monorepo cross-checks are bundled into the single `workspace-dependencies` rule.
- ⚠️ **One known divergence**: the programmatic workspaces flow passes `internalExactVersionsIgnore` so workspace-internal package names skip exact-version checks; the `exact-versions` ESLint rule has no equivalent option yet.
- The three opt-in rules (`satisfies-version`, `satisfies-versions-between-dependencies`, `satisfies-versions-from-dependencies`) are not part of any `checkRecommended` flow.

## Workspace API Checks (`CheckPackageWithWorkspacesApi` — `check-package-with-workspaces.ts`)

The workspace API exposes only `checkRecommended`, which internally runs the root `checkNoDependencies`, the root `checkRecommended`, and additional monorepo-wide checks. The ESLint rules below cover the monorepo-specific portions.

| Workspace-level check                                      | Core function(s)                                                                 | ESLint rule                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| Root has no `dependencies`                                 | `checkNoDependencies` (root only)                                                | `root-workspace-should-not-have-dependencies` ✅ |
| Monorepo direct duplicate dependencies (root↔sub, sub↔sub) | `checkDuplicateDependencies` (internal)                                          | `workspace-dependencies` ✅ (partial)            |
| Monorepo subpackage peer dependencies                      | `checkMonorepoDirectSubpackagePeerDependencies` → `checkSatisfiesPeerDependency` | `workspace-dependencies` ✅ (partial)            |

## ESLint rule test coverage

| ESLint rule                                              | Test file                                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `exact-versions`                                         | `exact-versions.ruletester.test.ts` ✅                                     |
| `satisfies-versions-from-dependencies`                   | `satisfies-versions-from-dependencies.test.ts` ✅                          |
| `satisfies-versions-between-dependencies`                | `satisfies-versions-between-dependencies.test.ts` ✅                       |
| `direct-peer-dependencies`                               | `direct-peer-dependencies.test.ts` ✅                                      |
| `direct-duplicate-dependencies`                          | `direct-duplicate-dependencies.test.ts` ✅                                 |
| `resolutions-versions-match`                             | `resolutions-versions-match.ruletester.test.ts` ✅                         |
| `resolutions-has-explanation`                            | `resolutions-has-explanation.ruletester.test.ts` ✅                        |
| `min-range-dependencies-satisfies-dev-dependencies`      | `min-range-dependencies-satisfies-dev-dependencies.ruletester.test.ts` ✅  |
| `min-range-peer-dependencies-satisfies-dependencies`     | `min-range-peer-dependencies-satisfies-dependencies.ruletester.test.ts` ✅ |
| `satisfies-version`                                      | `satisfies-version.ruletester.test.ts` ✅                                  |
| `root-workspace-should-not-have-dependencies`            | `root-workspace-should-not-have-dependencies.ruletester.test.ts` ✅        |
| `identical-versions`                                     | `identical-versions.test.ts` ✅                                            |
| `identical-versions-than-dependency`                     | `identical-versions-than-dependency.test.ts` ✅                            |
| `identical-versions-than-dev-dependency-of-dependency`   | `identical-versions-than-dev-dependency-of-dependency.test.ts` ✅          |
| `satisfies-versions-in-dependency`                       | `satisfies-versions-in-dependency.test.ts` ✅                              |
| `satisfies-versions-from-dev-dependencies-of-dependency` | `satisfies-versions-from-dev-dependencies-of-dependency.test.ts` ✅        |
| `workspace-dependencies`                                 | `workspace-dependencies.test.ts` ✅                                        |

## Checks not yet migrated to ESLint (summary)

- `checkNoDependencies` — partially migrated: `root-workspace-should-not-have-dependencies` covers the workspace-root case only; no ESLint rule yet for the standalone `checkNoDependencies(type)` use case

## Checks missing unit tests (summary)

- `checkDirectDuplicateDependencies` (core function tested indirectly via `checkDuplicateDependencies.test.ts`)
- `checkResolutionsHasExplanation`
- `checkIdenticalVersionsThanDevDependencyOfDependency` (core function is source-agnostic — no unique behavior to unit-test; ESLint rule has integration test)
- `checkSatisfiesVersionsInDevDependenciesOfDependency`
- `checkSatisfiesVersionsBetweenDependencies` (covered at the ESLint rule level)
- `checkRecommended` (meta-check; combines others)
