# Require peer dependencies of direct dependencies to be present and satisfied

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

A peer dependency is not installed by the package declaring it: it has to be provided by the package depending on it. This rule reads the `peerDependencies` of each of your direct dependencies and reports the ones missing from your `package.json`, or declared with a version that does not satisfy the required range.

Where a peer dependency is allowed to be declared depends on the `library` setting and on where the dependency itself is declared:

| Dependency declared in | `library: false`                  | `library: true`                                            |
| :--------------------- | :-------------------------------- | :--------------------------------------------------------- |
| `devDependencies`      | `devDependencies`, `dependencies` | `devDependencies`, `dependencies`                          |
| `dependencies`         | `devDependencies`, `dependencies` | `dependencies`, `peerDependencies`                         |
| `optionalDependencies` | `devDependencies`, `dependencies` | `dependencies`, `optionalDependencies`, `peerDependencies` |

Dev-only peer dependencies are an exception: a peer dependency whose name matches `@types/*` or `*/types`, or is listed in the `allowedPeerInDevDependencies` option, is always allowed in `devDependencies`, even for a library. Such a type-only package is never shipped at runtime, so it does not need to be re-exposed as a `dependency` or `peerDependency`.

Peer dependencies marked `optional` in `peerDependenciesMeta` are ignored, and so are the ones already covered by a matching entry of your own `peerDependencies`.

When `library` is false, a missing peer dependency that is already provided by another direct dependency with a compatible range is not reported. Set the `REPORT_PROVIDED_PEER_DEPENDENCIES` environment variable to `warn` or `1` to report them anyway.

## Fail

With `@babel/cli` declaring `"@babel/core": "^7.0.0"` as a peer dependency:

```json
{
  "name": "example",
  "devDependencies": {
    "@babel/cli": "7.28.3"
  }
}
```

## Pass

```json
{
  "name": "example",
  "devDependencies": {
    "@babel/cli": "7.28.3",
    "@babel/core": "7.28.4"
  }
}
```

## Options

| Name                           | Type                           | Default | Description                                                                                                                             |
| :----------------------------- | :----------------------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `onlyWarnsFor`                 | `Record<string, OnlyWarnsFor>` | `{}`    | Maps the dependency requiring the peer dependency (or `"*"`) to the peer dependency names to only warn for when the version is invalid. |
| `onlyWarnsForMissing`          | `Record<string, OnlyWarnsFor>` | `{}`    | Same, for missing peer dependencies.                                                                                                    |
| `allowedPeerInDevDependencies` | `string[]`                     | `[]`    | Peer dependency names allowed in `devDependencies` even for a library, in addition to the built-in `@types/*` and `*/types` packages.   |
| `comment`                      | `string`                       | —       | Explanation of what this rule is enabled for, appended to the messages it reports.                                                      |

`OnlyWarnsFor` is a list of dependency names, each optionally written as `{ name, comment }` — see [`onlyWarnsFor`](../../README.md#onlywarnsfor).

```js
"check-package-dependencies/require-direct-peer-dependencies": [
  "error",
  {
    onlyWarnsForMissing: { "@babel/cli": ["@babel/core"] },
    allowedPeerInDevDependencies: ["typescript"],
  },
]
```
