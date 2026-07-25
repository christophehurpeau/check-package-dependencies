<h1 align="center">
  check-package-dependencies
</h1>

<p align="center">
  Check package dependencies for duplicates, peer dependencies satisfaction and more early
</p>

<p align="center">
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/npm/v/check-package-dependencies.svg?style=flat-square" alt="npm version"></a>
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/npm/dw/check-package-dependencies.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/node/v/check-package-dependencies.svg?style=flat-square" alt="node version"></a>
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/npm/types/check-package-dependencies.svg?style=flat-square" alt="types"></a>
  <a href="https://codecov.io/gh/christophehurpeau/check-package-dependencies"><img src="https://img.shields.io/codecov/c/github/christophehurpeau/check-package-dependencies/main.svg?style=flat-square"></a>
  <a href="https://christophehurpeau.github.io/check-package-dependencies/"><img src="https://img.shields.io/website.svg?down_color=lightgrey&down_message=offline&up_color=blue&up_message=online&url=https%3A%2F%2Fchristophehurpeau.github.io%2Fcheck-package-dependencies%2F?style=flat-square"></a>
</p>

### Install

```sh
npm install --save-dev check-package-dependencies
```

### What is it for ?

Based on my experience, I often saw issues with duplicate dependencies like two versions of babel, or two versions a react library that cannot share a context, peer dependencies not respected. I wrote specific script inside each repository for a long time, but they tend to be hard to maintain, hard to read, and not generic enough.

I you have any idea, or found bug, please open an issue.

### Try it with cli

Use npx to try and check `package.json` in current directory:

```bash
npx check-package-dependencies
```

### ESLint plugin

The plugin lints `package.json` files with a dedicated ESLint [language](https://eslint.org/docs/latest/extend/languages), so errors are reported inline, with fixes and suggestions when possible.

```js
// eslint.config.js
import checkPackageDependenciesPlugin from "check-package-dependencies/eslint-plugin";

export default [
  // for an application
  checkPackageDependenciesPlugin.configs.recommended,
  // …or for a library, which also sets the "isLibrary" setting
  // checkPackageDependenciesPlugin.configs["recommended-library"],
];
```

Available configs:

| Config                | Emoji | Description                                                                                                      |
| :-------------------- | :---- | :--------------------------------------------------------------------------------------------------------------- |
| `base`                |       | Only registers the `package-json` language and the plugin. No rule enabled.                                      |
| `recommended`         | ✅    | Recommended rules for an application.                                                                            |
| `recommended-library` | 📚    | Recommended rules for a library: sets `isLibrary`, allows ranges in `dependencies` and adds the min range rules. |

To enable a rule that is not part of a config, or to change its options, add it to your config:

```js
export default [
  checkPackageDependenciesPlugin.configs.recommended,
  {
    files: ["package.json"],
    rules: {
      "check-package-dependencies/satisfies-versions": [
        "error",
        { devDependencies: { eslint: "^10.0.0" } },
      ],
    },
  },
];
```

#### Settings

| Setting     | Default | Description                                                                                                                                                  |
| :---------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isLibrary` | `false` | The package is published and consumed by other packages: ranges are expected in `dependencies` and peer dependencies can be satisfied by `peerDependencies`. |

```js
export default [
  {
    files: ["package.json"],
    settings: { "check-package-dependencies": { isLibrary: true } },
  },
];
```

#### Rules

💼 Configs enabling the rule: ✅ `recommended`, 📚 `recommended-library`.
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- begin auto-generated rules list -->

| Name                                                                                                                                            | Description                                                                                                           | 💼    | 🔧  | 💡  |
| :---------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :---- | :-- | :-- |
| [consistent-workspace-dependencies](documentation/rules/consistent-workspace-dependencies.md)                                                   | Enforce consistent dependency versions across the packages of a workspace                                             | ✅ 📚 |     |     |
| [min-range-dependencies-satisfies-dev-dependencies](documentation/rules/min-range-dependencies-satisfies-dev-dependencies.md)                   | Enforce the minimum of a `dependencies` range to satisfy the version in `devDependencies`                             | 📚    | 🔧  |     |
| [min-range-peer-dependencies-satisfies-dependencies](documentation/rules/min-range-peer-dependencies-satisfies-dependencies.md)                 | Enforce the minimum of a `peerDependencies` range to satisfy the version in `dependencies`                            | 📚    | 🔧  |     |
| [no-direct-duplicate-dependencies](documentation/rules/no-direct-duplicate-dependencies.md)                                                     | Disallow dependencies that will be installed twice because a direct dependency requires an incompatible range         | ✅ 📚 |     |     |
| [no-root-workspace-dependencies](documentation/rules/no-root-workspace-dependencies.md)                                                         | Disallow `dependencies` in the root package.json of a workspace                                                       | ✅ 📚 |     |     |
| [require-direct-peer-dependencies](documentation/rules/require-direct-peer-dependencies.md)                                                     | Require peer dependencies of direct dependencies to be present and satisfied                                          | ✅ 📚 |     |     |
| [require-exact-versions](documentation/rules/require-exact-versions.md)                                                                         | Require exact versions in `dependencies`, `devDependencies` and `resolutions`                                         | ✅ 📚 | 🔧  |     |
| [require-identical-versions](documentation/rules/require-identical-versions.md)                                                                 | Require configured dependencies to have the same version as another dependency of the same package.json               |       |     |     |
| [require-identical-versions-as-dependency](documentation/rules/require-identical-versions-as-dependency.md)                                     | Require configured dependencies to have the same version as the one in the `dependencies` of another dependency       |       |     |     |
| [require-identical-versions-as-dev-dependency-of-dependency](documentation/rules/require-identical-versions-as-dev-dependency-of-dependency.md) | Require configured dependencies to have the same version as the one in the `devDependencies` of another dependency    |       |     |     |
| [require-resolutions-explanation](documentation/rules/require-resolutions-explanation.md)                                                       | Require every entry of `resolutions` to be explained in `resolutionsExplained`                                        | ✅ 📚 |     |     |
| [require-workspace-protocol](documentation/rules/require-workspace-protocol.md)                                                                 | Require dependencies on other packages of the workspace to use the `workspace:` protocol                              | ✅ 📚 | 🔧  |     |
| [resolutions-versions-match](documentation/rules/resolutions-versions-match.md)                                                                 | Require `resolutions` versions to match the versions in `dependencies` and `devDependencies`                          | ✅ 📚 |     | 💡  |
| [satisfies-versions](documentation/rules/satisfies-versions.md)                                                                                 | Require configured dependencies to be present and to satisfy the configured ranges                                    |       |     | 💡  |
| [satisfies-versions-between-dependencies](documentation/rules/satisfies-versions-between-dependencies.md)                                       | Require the range of a dependency in one dependency to satisfy the range of the same dependency in another dependency |       |     |     |
| [satisfies-versions-from-dependencies](documentation/rules/satisfies-versions-from-dependencies.md)                                             | Require configured dependencies to satisfy the ranges declared in the `dependencies` of another dependency            |       |     | 💡  |
| [satisfies-versions-from-dev-dependencies-of-dependency](documentation/rules/satisfies-versions-from-dev-dependencies-of-dependency.md)         | Require configured dependencies to satisfy the ranges declared in the `devDependencies` of another dependency         |       |     | 💡  |
| [satisfies-versions-in-dependency](documentation/rules/satisfies-versions-in-dependency.md)                                                     | Require the dependencies of an installed dependency to satisfy the configured ranges                                  |       |     |     |

<!-- end auto-generated rules list -->

#### `onlyWarnsFor`

Most rules accept an `onlyWarnsFor` option that downgrades errors to warnings, printed in the console instead of being reported to ESLint. Entries that never matched an error are reported as errors, so the list stays up to date.

Depending on the rule, `onlyWarnsFor` is either an array of dependency names:

```js
"check-package-dependencies/require-exact-versions": ["error", { onlyWarnsFor: ["type-fest"] }]
```

or a mapping from the dependency causing the error to the dependency names to only warn for, `"*"` matching any dependency:

```js
"check-package-dependencies/no-direct-duplicate-dependencies": ["error", { onlyWarnsFor: { "*": ["type-fest"] } }]
```

### Uses Cases

- Check devDependencies are exact versions
- Check resolutions versions matches versions in devDependencies or dependencies
- Check direct peer dependencies are respected, and list exceptions
- Check some dependencies in your package.json respect another dependency dependencies
- Lock versions depending on certain conditions
- Be more confident when automerging [renovate](https://www.whitesourcesoftware.com/free-developer-tools/renovate)'s PR

If something is missing for your need, please open an issue !

### How to use

Create a script, for example `scripts/check-package.js`. Add it in `"scripts"` in your package.json. Run in CI and/or in your husky hooks.

```js
import { createCheckPackage } from "check-package-dependencies";

await createCheckPackage(/* '.' */)
  // Check that your package.json contains only exact versions of package, not range.
  .checkExactVersions({
    // When isLibrary is true, it doesnt check "dependencies" as they should mostly have a range, not an exact version
    isLibrary: false,
  })
  .checkDirectPeerDependencies({
    // Allow to only warn for not respected peer dependencies.
    // Example: { '@babel/cli': ['@babel/core'] }
    // Only warns for missing "@babel/core" peer dependency asked in "@babel/cli".
    // You can also use "*" for any library
    // { '*': ['semver'] }
    missingOnlyWarnsFor: {},
    invalidOnlyWarnsFor: {},
  })
  // Check that there are no duplicates among your dependencies and your devDependencies.
  // For example, If you use "@babel/core": "7.0.0" and one of your direct dependency requires "^7.0.1" (in dependencies, not peerDependency)
  // you will have two versions of @babel/core. This check will display an error that can be changed to a warning.
  // You will probably need to add warnings for common library where duplicate have low impact,
  // like type-fest or fast-deep-equal.
  .checkDirectDuplicateDependencies({
    onlyWarnsFor: { "*": "type-fest" },
  })
  // Check resolutions versions matches versions in devDependencies or dependencies
  .checkResolutionsVersionsMatch()
  // Check that all your resolutions are also present in an "resolutionsExplained" field, forcing you to explain why the resolution was necessary
  .checkResolutionsHasExplanation()
  // Same as calling .checkExactVersions(), checkDirectPeerDependencies(), checkDirectDuplicateDependencies()
  // and checkResolutionsHasExplanation(). It's recommended to use it as new recommended features will be added here too.
  .checkRecommended({
    isLibrary: false,
    peerDependenciesOnlyWarnsFor: [],
    directDuplicateDependenciesOnlyWarnsFor: ["type-fest"],
  })
  // Check that your package.json contains the same version of @babel/core than react-scripts, both in resolutions and devDependencies
  .checkIdenticalVersionsThanDependency("react-scripts", {
    resolutions: ["@babel/core"],
    devDependencies: ["@babel/core"],
  })
  // Check that your package.json dependencies specifically satisfies the range set in another dependencies
  .checkSatisfiesVersionsFromDependency("@pob/eslint-config", {
    devDependencies: [
      "@typescript-eslint/eslint-plugin",
      "@typescript-eslint/parser",
    ],
  })
  // Check that your package.json dependencies have the exact same version that another dependency also present in your package.json
  // The react-dom version should match react, so this check will ensure it does
  .checkIdenticalVersions({
    dependencies: {
      react: {
        dependencies: ["react-dom"],
        devDependencies: ["react-test-renderer"],
      },
    },
  })
  .run();
```

```js
import { createCheckPackage } from "check-package-dependencies";

await createCheckPackage(/* '.' */)
  // Call .checkExactVersions(), checkDirectPeerDependencies(), checkDirectDuplicateDependencies()
  // checkResolutionsVersionsMatch() and checkResolutionsHasExplanation()
  .checkRecommended({})
  .run();
```

If you use workspaces:

```js
import { createCheckPackageWithWorkspaces } from "check-package-dependencies";

await createCheckPackageWithWorkspaces()
  // Call .checkExactVersions(), checkDirectPeerDependencies(), checkDirectDuplicateDependencies()
  // checkResolutionsVersionsMatch() and checkResolutionsHasExplanation() for root package and workspaces packages, but also
  // checks your workspaces packages doesn't have different versions than the ones in devDependencies of root packages.
  .checkRecommended({
    isLibrary: (pkgName) => !pkgName.endsWith("-example"),
    peerDependenciesOnlyWarnsFor: [],
    directDuplicateDependenciesOnlyWarnsFor: ["semver", "github-username"],
  })
  .forRoot((rootPackageCheck) => {
    /* rootPackageCheck has the same API presented for single package */
  })
  .for("packageName", (pkgCheck) => {
    /* pkgCheck has the same API presented for single package */
  })
  .run();
```
