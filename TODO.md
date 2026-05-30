# TODO

> **Note for agents:** Update this file whenever you add or migrate a check. The ESLint migration column tracks whether a check has a corresponding ESLint rule in `src/eslint/rules/`. The unit test column tracks whether a dedicated test file exists in `src/checks/`.

## Public API Checks (`CheckPackageApi`)

| Check method                                          | Core function                                       | ESLint rule                                                                                                 | Unit test                                         |
| ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `checkExactVersions`                                  | `checkExactVersions`                                | `exact-versions` ✅                                                                                         | `checkExactVersions.test.ts` ✅                   |
| `checkExactDevVersions`                               | `checkExactVersions` (devDeps only)                 | covered by `exact-versions` (partial) ⚠️                                                                    | covered by `checkExactVersions.test.ts` ⚠️        |
| `checkResolutionsVersionsMatch`                       | `checkResolutionsVersionsMatch`                     | `resolutions-versions-match` ✅                                                                             | `checkResolutionsVersionsMatch.test.ts` ✅        |
| `checkNoDependencies`                                 | `checkNoDependencies`                               | `root-workspace-should-not-have-dependencies` ⚠️ (workspace root only, via `check-package-with-workspaces`) | `checkNoDependencies.test.ts` ✅                  |
| `checkDirectPeerDependencies`                         | `checkDirectPeerDependencies`                       | `direct-peer-dependencies` ✅                                                                               | `checkDirectPeerDependencies.test.ts` ✅          |
| `checkDirectDuplicateDependencies`                    | `checkDirectDuplicateDependencies`                  | `direct-duplicate-dependencies` ✅                                                                          | ❌ no test file                                   |
| `checkResolutionsHasExplanation`                      | `checkResolutionsHasExplanation`                    | `resolutions-has-explanation` ✅                                                                            | ❌ no test file                                   |
| `checkRecommended`                                    | meta-check (combines others)                        | N/A                                                                                                         | ❌ no test file                                   |
| `checkIdenticalVersionsThanDependency`                | `checkIdenticalVersionsThanDependency`              | ❌ not migrated                                                                                             | ❌ no test file                                   |
| `checkIdenticalVersionsThanDevDependencyOfDependency` | `checkIdenticalVersionsThanDependency` (on devDeps) | ❌ not migrated                                                                                             | ❌ no test file                                   |
| `checkSatisfiesVersions`                              | `checkSatisfiesVersions`                            | `satisfies-version` ✅                                                                                      | `checkSatisfiesVersions.test.ts` ✅               |
| `checkSatisfiesVersionsFromDependency`                | `checkSatisfiesVersionsFromDependency`              | `satisfies-versions-from-dependencies` ✅                                                                   | `checkSatisfiesVersionsFromDependency.test.ts` ✅ |
| `checkSatisfiesVersionsInDevDependenciesOfDependency` | `checkSatisfiesVersionsFromDependency` (on devDeps) | ❌ not migrated                                                                                             | ❌ no test file                                   |
| `checkIdenticalVersions`                              | `checkIdenticalVersions`                            | ❌ not migrated                                                                                             | `checkIdenticalVersions.test.ts` ✅               |
| `checkSatisfiesVersionsBetweenDependencies`           | `checkSatisfiesVersionsBetweenDependencies`         | `satisfies-versions-between-dependencies` ✅                                                                | ❌ no dedicated test (ESLint rule has test)       |
| `checkSatisfiesVersionsInDependency`                  | `checkSatisfiesVersionsInDependency`                | ❌ not migrated                                                                                             | `checkSatisfiesVersionsInDependency.test.ts` ✅   |
| `checkMinRangeDependenciesSatisfiesDevDependencies`   | `checkMinRangeSatisfies` (deps→devDeps)             | `min-range-dependencies-satisfies-dev-dependencies` ✅                                                      | `checkMinRangeSatisfies.test.ts` ✅               |
| `checkMinRangePeerDependenciesSatisfiesDependencies`  | `checkMinRangeSatisfies` (peer→deps)                | `min-range-peer-dependencies-satisfies-dependencies` ✅                                                     | covered by `checkMinRangeSatisfies.test.ts` ⚠️    |

Legend: ✅ done · ⚠️ partial/shared · ❌ missing

## Workspace API Checks (`CheckPackageWithWorkspacesApi` — `check-package-with-workspaces.ts`)

The workspace API exposes only `checkRecommended`, which internally runs the root `checkNoDependencies`, the root `checkRecommended`, and additional monorepo-wide checks. The ESLint rules below cover the monorepo-specific portions.

| Workspace-level check                                      | Core function(s)                                                                 | ESLint rule                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| Root has no `dependencies`                                 | `checkNoDependencies` (root only)                                                | `root-workspace-should-not-have-dependencies` ✅ |
| Monorepo direct duplicate dependencies (root↔sub, sub↔sub) | `checkDuplicateDependencies` (internal)                                          | `workspace-dependencies` ✅ (partial)            |
| Monorepo subpackage peer dependencies                      | `checkMonorepoDirectSubpackagePeerDependencies` → `checkSatisfiesPeerDependency` | `workspace-dependencies` ✅ (partial)            |

## ESLint rule test coverage

| ESLint rule                                          | Test file                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `exact-versions`                                     | `exact-versions.ruletester.test.ts` ✅                                     |
| `satisfies-versions-from-dependencies`               | `satisfies-versions-from-dependencies.test.ts` ✅                          |
| `satisfies-versions-between-dependencies`            | `satisfies-versions-between-dependencies.test.ts` ✅                       |
| `direct-peer-dependencies`                           | `direct-peer-dependencies.test.ts` ✅                                      |
| `direct-duplicate-dependencies`                      | `direct-duplicate-dependencies.test.ts` ✅                                 |
| `resolutions-versions-match`                         | `resolutions-versions-match.ruletester.test.ts` ✅                         |
| `resolutions-has-explanation`                        | `resolutions-has-explanation.ruletester.test.ts` ✅                        |
| `min-range-dependencies-satisfies-dev-dependencies`  | `min-range-dependencies-satisfies-dev-dependencies.ruletester.test.ts` ✅  |
| `min-range-peer-dependencies-satisfies-dependencies` | `min-range-peer-dependencies-satisfies-dependencies.ruletester.test.ts` ✅ |
| `satisfies-version`                                  | `satisfies-version.ruletester.test.ts` ✅                                  |
| `root-workspace-should-not-have-dependencies`        | `root-workspace-should-not-have-dependencies.ruletester.test.ts` ✅        |
| `workspace-dependencies`                             | `workspace-dependencies.test.ts` ✅                                        |

## Checks not yet migrated to ESLint (summary)

- `checkNoDependencies` — partially migrated: `root-workspace-should-not-have-dependencies` covers the workspace-root case only; no ESLint rule yet for the standalone `checkNoDependencies(type)` use case
- `checkIdenticalVersions`
- `checkIdenticalVersionsThanDependency`
- `checkIdenticalVersionsThanDevDependencyOfDependency`
- `checkSatisfiesVersionsInDependency`
- `checkSatisfiesVersionsInDevDependenciesOfDependency`

## Checks missing unit tests (summary)

- `checkDirectDuplicateDependencies` (core function tested indirectly via `checkDuplicateDependencies.test.ts`)
- `checkResolutionsHasExplanation`
- `checkIdenticalVersionsThanDependency`
- `checkIdenticalVersionsThanDevDependencyOfDependency`
- `checkSatisfiesVersionsInDevDependenciesOfDependency`
- `checkSatisfiesVersionsBetweenDependencies` (covered at the ESLint rule level)
- `checkRecommended` (meta-check; combines others)
