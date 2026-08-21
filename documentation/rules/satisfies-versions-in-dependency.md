# Require the dependencies of an installed dependency to satisfy the configured ranges

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

<!-- end auto-generated rule header -->

Checks the `package.json` of an installed dependency, instead of yours. Useful to assert what a transitive dependency resolves to: that a dependency you rely on has migrated to the major version of a shared package, or that it no longer depends on a package you removed from your tree.

For each configured range, the rule reports the dependency of the installed package when it is missing, or when its declared range neither satisfies nor intersects the configured range. A `null` range asserts the opposite: the dependency must not be present.

## Fail

With `some-lib` depending on `"semver": "6.3.1"` and on `"lodash": "4.17.21"`:

```js
"check-package-dependencies/satisfies-versions-in-dependency": [
  "error",
  {
    dependencies: {
      "some-lib": {
        dependencies: { semver: "^7.0.0", lodash: null },
      },
    },
  },
]
```

## Pass

With `some-lib` depending on `"semver": "^7.8.0"` and not depending on `lodash`:

```js
"check-package-dependencies/satisfies-versions-in-dependency": [
  "error",
  {
    dependencies: {
      "some-lib": {
        dependencies: { semver: "^7.0.0", lodash: null },
      },
    },
  },
]
```

## Options

| Name                      | Type                                 | Default | Description                                                                        |
| :------------------------ | :----------------------------------- | :------ | :--------------------------------------------------------------------------------- |
| `dependencies` (required) | `Record<string, DependenciesRanges>` | —       | Maps a dependency name to the ranges its own dependencies have to satisfy.         |
| `onlyWarnsFor`            | `OnlyWarnsFor`                       | `[]`    | Dependency names to only warn for.                                                 |
| `comment`                 | `string`                             | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |

`DependenciesRanges` maps `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies` and `resolutions` to a record of dependency name to range, or `null` to require the dependency to be absent. It also accepts a `comment` explaining what the entry is configured for, which replaces the rule `comment` in the messages that entry produces.

`OnlyWarnsFor` is a list of dependency names, each optionally written as `{ name, comment }` — see [`onlyWarnsFor`](../../README.md#onlywarnsfor).
