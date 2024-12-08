<h3 align="center">
  check-package-dependencies
</h3>

<p align="center">
  Check package dependencies for duplicates, peer dependencies satisfaction and more early
</p>

<p align="center">
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/npm/v/check-package-dependencies.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/npm/dw/check-package-dependencies.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/node/v/check-package-dependencies.svg?style=flat-square"></a>
  <a href="https://npmjs.org/package/check-package-dependencies"><img src="https://img.shields.io/npm/types/check-package-dependencies.svg?style=flat-square"></a>
  <a href="https://codecov.io/gh/christophehurpeau/check-package-dependencies"><img src="https://img.shields.io/codecov/c/github/christophehurpeau/check-package-dependencies/master.svg?style=flat-square"></a>
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
  .checkSatisfiesVersionsFromDependency("@pob/eslint-config-typescript", {
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
