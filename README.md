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

Use npx to check the `package.json` of the current directory, and the `package.json` of
every workspace member when it declares workspaces:

```bash
npx check-package-dependencies
```

The cli runs the [`recommended` config](#eslint-plugin) through eslint, which it needs
installed (`npm install --save-dev eslint`). It ignores the eslint configuration of the
project, so no setup is required, and takes an optional directory:

```bash
npx check-package-dependencies packages/app
```

| Option            | Description                                  |
| :---------------- | :------------------------------------------- |
| `--fix`           | apply the fixes the rules provide            |
| `--quiet`         | report errors only, hiding warnings          |
| `--format <name>` | eslint formatter to use (default: `stylish`) |
| `-h`, `--help`    | show the usage                               |

To enable other rules, to configure their options, or to lint `package.json` alongside the
rest of the codebase, use the eslint plugin instead of the cli.

### ESLint plugin

The plugin lints `package.json` files with a dedicated ESLint [language](https://eslint.org/docs/latest/extend/languages), so errors are reported inline, with fixes and suggestions when possible.

```js
// eslint.config.js
import checkPackageDependenciesPlugin from "check-package-dependencies/eslint-plugin";

export default [checkPackageDependenciesPlugin.configs.recommended];
```

Available configs:

| Config        | Emoji | Description                                                                                                                               |
| :------------ | :---- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `base`        |       | Only registers the `package-json` language and the plugin. No rule enabled.                                                               |
| `recommended` | ✅    | Recommended rules. A library is not checked like a package that is not published: this is driven by the `library` setting, not by config. |

To enable a rule that is not part of a config, or to change its options, add it to your config:

```js
export default [
  checkPackageDependenciesPlugin.configs.recommended,
  {
    files: ["**/package.json"],
    rules: {
      "check-package-dependencies/satisfies-versions": [
        "error",
        { devDependencies: { eslint: "^10.0.0" } },
      ],
    },
  },
];
```

Every rule declares the `package-json` language it supports through [`meta.languages`](https://eslint.org/docs/latest/extend/custom-rules#rule-structure), so ESLint reports a `rule-unsupported-language` error instead of silently doing nothing when a rule is enabled on a config entry that lints something else. Registering the plugin under another name keeps working, the plugin declaring `check-package-dependencies` as its `meta.namespace`:

```js
export default [
  {
    files: ["package.json"],
    plugins: { pkg: checkPackageDependenciesPlugin },
    language: "pkg/package-json",
    rules: { "pkg/require-pinned-versions": "error" },
    // the settings key is the plugin namespace, whatever name the plugin is registered under
    settings: { "check-package-dependencies": { library: false } },
  },
];
```

#### Settings

| Setting   | Default  | Description                                                                                                                                                                                                      |
| :-------- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `library` | `"auto"` | Whether a package is published and consumed by other packages. A library keeps ranges in `dependencies` and can satisfy a peer dependency with its own `peerDependencies`; any other package pins every version. |

Accepted values:

| Value                | Meaning                                                                                                                                                       |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `"auto"` _(default)_ | Derived from the `package.json`: a workspace root or a `private` package is not a library, anything else is.                                                  |
| `true` / `false`     | Every package checked with this config entry is, or is not, a library.                                                                                        |
| `string[]`           | Package name patterns: `*` matches any characters, a `!` prefix excludes, and the last matching pattern wins. A package matching no pattern is not a library. |

A single package published to npm needs no setting at all: `"auto"` detects it. Set the
value explicitly when the detection is wrong for you — a package that is published but
should still pin every version, or one that is not `private` yet not consumed by anything:

```js
export default [
  checkPackageDependenciesPlugin.configs.recommended,
  {
    files: ["**/package.json"],
    settings: {
      "check-package-dependencies": { library: false },
    },
  },
];
```

In a monorepo, use the `**/package.json` glob the configs themselves use, so the setting
applies to the root and to every member:

```js
export default [
  checkPackageDependenciesPlugin.configs.recommended,
  {
    files: ["**/package.json"],
    settings: {
      "check-package-dependencies": {
        // everything under @scope is published, except the apps and the examples
        library: ["@scope/*", "!@scope/app-*", "!@scope/*-example"],
      },
    },
  },
];
```

The setting is resolved against the `package.json` being linted, so in a monorepo it has
to hold for every package the config applies to: a list of patterns, or `"auto"`, is what
a monorepo mixing published and private packages wants — a plain `true` would make the
root a library too.

That also means scoping the setting to a member with `files` does not fully work:

```js
export default [
  checkPackageDependenciesPlugin.configs.recommended,
  {
    files: ["**/package.json"],
    settings: { "check-package-dependencies": { library: true } },
  },
  {
    // applies when linting packages/app/package.json itself, but the root's
    // consistent-workspace-dependencies still classifies it with library: true above
    files: ["packages/app/package.json"],
    settings: { "check-package-dependencies": { library: false } },
  },
];
```

Prefer a list of patterns, which gives the same answer wherever the package is resolved
from. Note that a list replaces the detection entirely: `private` is no longer taken into
account, so a private package matching a pattern is a library, and the root is only
excluded if its name matches no pattern (or is excluded with `!`).

#### Migrating from v12

- The programmatic API is removed: `createCheckPackage`,
  `createCheckPackageWithWorkspaces` and everything they exported are gone, and the
  package root now exports the eslint plugin, as `check-package-dependencies/eslint-plugin`
  already did. Replace a `scripts/check-package.js` calling `checkRecommended()` with
  `eslint package.json` and the `recommended` config, or with the cli.
- The cli runs the `recommended` config through eslint instead of its own checks, so it
  now requires `eslint` to be installed. Compared to the checks it replaces:
  - [require-workspace-protocol](documentation/rules/require-workspace-protocol.md) is
    checked, which the programmatic `checkRecommended` never did;
  - a dependency on a workspace member declared as a plain range is reported by
    [require-pinned-versions](documentation/rules/require-pinned-versions.md); it was
    exempted before. Run `--fix` on `require-workspace-protocol` to use the `workspace:`
    protocol instead;
  - `allowRangeVersionsInDependencies` has no equivalent: use the `library` setting.
- The `isLibrary` option no longer throws, as there is no option left to pass — only the
  `isLibrary` **setting** of the plugin is still reported as renamed to `library`.

#### Migrating from v11

- The `recommended-library` config is removed: use `recommended`, and let `library`
  decide. `"auto"` covers the usual case; set it explicitly when the detection is wrong
  for you.
- `require-exact-versions` is renamed to `require-pinned-versions` and its
  `dependencies` / `devDependencies` / `resolutions` options are removed: which fields
  are checked now follows `library`.
- The two `min-range-*` rules are part of `recommended`, and now report whether or not
  the package is a library — they were previously only run for a library.
- The `isLibrary` setting is renamed to `library`, as it accepts more than a boolean.
  Using the old name is reported as a lint error once per `package.json`.
- `library` defaults to `"auto"` instead of `false`. A published, non-private package is
  therefore checked as a library now: ranges become allowed in its `dependencies`, and a peer dependency of a
  `dependencies` entry must be satisfied by its `dependencies` or `peerDependencies`
  rather than by its `devDependencies`. Set `library: false` to keep the previous
  behaviour.

#### Rules

💼 Configs enabling the rule: ✅ `recommended`. A few rules check a library differently,
depending on the `library` setting: see each rule’s page.
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- begin auto-generated rules list -->

| Name                                                                                                                                            | Description                                                                                                           | 💼  | 🔧  | 💡  |
| :---------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :-- | :-- | :-- |
| [consistent-workspace-dependencies](documentation/rules/consistent-workspace-dependencies.md)                                                   | Enforce consistent dependency versions across the packages of a workspace                                             | ✅  | 🔧  |     |
| [min-range-dependencies-satisfies-dev-dependencies](documentation/rules/min-range-dependencies-satisfies-dev-dependencies.md)                   | Enforce the minimum of a `dependencies` range to satisfy the version in `devDependencies`                             | ✅  | 🔧  |     |
| [min-range-peer-dependencies-satisfies-dependencies](documentation/rules/min-range-peer-dependencies-satisfies-dependencies.md)                 | Enforce the minimum of a `peerDependencies` range to satisfy the version in `dependencies`                            | ✅  | 🔧  |     |
| [no-direct-duplicate-dependencies](documentation/rules/no-direct-duplicate-dependencies.md)                                                     | Disallow dependencies that will be installed twice because a direct dependency requires an incompatible range         | ✅  |     |     |
| [no-root-workspace-dependencies](documentation/rules/no-root-workspace-dependencies.md)                                                         | Disallow `dependencies` in the root package.json of a workspace                                                       | ✅  |     |     |
| [require-direct-peer-dependencies](documentation/rules/require-direct-peer-dependencies.md)                                                     | Require peer dependencies of direct dependencies to be present and satisfied                                          | ✅  |     |     |
| [require-identical-versions](documentation/rules/require-identical-versions.md)                                                                 | Require configured dependencies to have the same version as another dependency of the same package.json               |     |     |     |
| [require-identical-versions-as-dependency](documentation/rules/require-identical-versions-as-dependency.md)                                     | Require configured dependencies to have the same version as the one in the `dependencies` of another dependency       |     |     |     |
| [require-identical-versions-as-dev-dependency-of-dependency](documentation/rules/require-identical-versions-as-dev-dependency-of-dependency.md) | Require configured dependencies to have the same version as the one in the `devDependencies` of another dependency    |     |     |     |
| [require-pinned-versions](documentation/rules/require-pinned-versions.md)                                                                       | Require pinned versions in `dependencies`, `devDependencies` and `resolutions`                                        | ✅  | 🔧  |     |
| [require-resolutions-explanation](documentation/rules/require-resolutions-explanation.md)                                                       | Require every entry of `resolutions` to be explained in `resolutionsExplained`                                        | ✅  |     |     |
| [require-workspace-protocol](documentation/rules/require-workspace-protocol.md)                                                                 | Require dependencies on other packages of the workspace to use the `workspace:` protocol                              | ✅  | 🔧  |     |
| [resolutions-versions-match](documentation/rules/resolutions-versions-match.md)                                                                 | Require `resolutions` versions to match the versions in `dependencies` and `devDependencies`                          | ✅  |     | 💡  |
| [satisfies-versions](documentation/rules/satisfies-versions.md)                                                                                 | Require configured dependencies to be present and to satisfy the configured ranges                                    |     |     | 💡  |
| [satisfies-versions-between-dependencies](documentation/rules/satisfies-versions-between-dependencies.md)                                       | Require the range of a dependency in one dependency to satisfy the range of the same dependency in another dependency |     |     |     |
| [satisfies-versions-from-dependencies](documentation/rules/satisfies-versions-from-dependencies.md)                                             | Require configured dependencies to satisfy the ranges declared in the `dependencies` of another dependency            |     |     | 💡  |
| [satisfies-versions-from-dev-dependencies-of-dependency](documentation/rules/satisfies-versions-from-dev-dependencies-of-dependency.md)         | Require configured dependencies to satisfy the ranges declared in the `devDependencies` of another dependency         |     |     | 💡  |
| [satisfies-versions-in-dependency](documentation/rules/satisfies-versions-in-dependency.md)                                                     | Require the dependencies of an installed dependency to satisfy the configured ranges                                  |     |     |     |

<!-- end auto-generated rules list -->

#### `onlyWarnsFor`

Most rules accept an `onlyWarnsFor` option that downgrades errors to warnings, printed in the console instead of being reported to ESLint. Entries that never matched an error are reported as errors, so the list stays up to date.

Depending on the rule, `onlyWarnsFor` is either an array of dependency names:

```js
"check-package-dependencies/require-pinned-versions": ["error", { onlyWarnsFor: ["type-fest"] }]
```

or a mapping from the dependency causing the error to the dependency names to only warn for, `"*"` matching any dependency:

```js
"check-package-dependencies/no-direct-duplicate-dependencies": ["error", { onlyWarnsFor: { "*": ["type-fest"] } }]
```

Any entry can be written as `{ name, comment }` instead of a bare name, to explain why the
exception exists:

```js
"check-package-dependencies/require-pinned-versions": [
  "error",
  {
    onlyWarnsFor: [
      { name: "type-fest", comment: "types only, a range cannot break the build" },
    ],
  },
]
```

#### `comment`

Every rule accepts a `comment`, explaining what it is enabled for. It is appended to every
message the rule reports, so the reason reaches whoever reads the lint output rather than
only whoever opens the config:

```js
"check-package-dependencies/require-resolutions-explanation": [
  "error",
  { comment: "our resolutions outlive the reason we added them" },
]
```

The rules configured with a list of dependencies accept one per entry too, which replaces
the rule `comment` in the messages that entry produces — see each rule's page for where it
goes:

```js
"check-package-dependencies/satisfies-versions": [
  "error",
  {
    comment: "ranges decided with the platform team",
    devDependencies: {
      eslint: { range: "^10.0.0", comment: "the plugin api changed in 10" },
    },
  },
]
```

reports:

```
error  devDependencies > eslint: Invalid: "9.0.0" should satisfies "^10.0.0" (the plugin api changed in 10)
```

### Uses Cases

- Check devDependencies are exact versions
- Check resolutions versions matches versions in devDependencies or dependencies
- Check direct peer dependencies are respected, and list exceptions
- Check some dependencies in your package.json respect another dependency dependencies
- Lock versions depending on certain conditions
- Be more confident when automerging [renovate](https://www.whitesourcesoftware.com/free-developer-tools/renovate)'s PR

If something is missing for your need, please open an issue !
