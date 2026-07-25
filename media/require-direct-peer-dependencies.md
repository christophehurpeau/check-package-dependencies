# Require peer dependencies of direct dependencies to be present and satisfied

💼 This rule is enabled in the ✅ `recommended` and 📚 `recommended-library` configs.

<!-- end auto-generated rule header -->

A peer dependency is not installed by the package declaring it: it has to be provided by the package depending on it. This rule reads the `peerDependencies` of each of your direct dependencies and reports the ones missing from your `package.json`, or declared with a version that does not satisfy the required range.

Where a peer dependency is allowed to be declared depends on the `isLibrary` setting and on where the dependency itself is declared:

| Dependency declared in | Application (`isLibrary: false`)  | Library (`isLibrary: true`)                                |
| :--------------------- | :-------------------------------- | :--------------------------------------------------------- |
| `devDependencies`      | `devDependencies`, `dependencies` | `devDependencies`, `dependencies`                          |
| `dependencies`         | `devDependencies`, `dependencies` | `dependencies`, `peerDependencies`                         |
| `optionalDependencies` | `devDependencies`, `dependencies` | `dependencies`, `optionalDependencies`, `peerDependencies` |

Peer dependencies marked `optional` in `peerDependenciesMeta` are ignored, and so are the ones already covered by a matching entry of your own `peerDependencies`.

For an application, a missing peer dependency that is already provided by another direct dependency with a compatible range is not reported. Set the `REPORT_PROVIDED_PEER_DEPENDENCIES` environment variable to `warn` or `1` to report them anyway.

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

| Name                  | Type                       | Default | Description                                                                                                                             |
| :-------------------- | :------------------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `onlyWarnsFor`        | `Record<string, string[]>` | `{}`    | Maps the dependency requiring the peer dependency (or `"*"`) to the peer dependency names to only warn for when the version is invalid. |
| `onlyWarnsForMissing` | `Record<string, string[]>` | `{}`    | Same, for missing peer dependencies.                                                                                                    |

```js
"check-package-dependencies/require-direct-peer-dependencies": [
  "error",
  { onlyWarnsForMissing: { "@babel/cli": ["@babel/core"] } },
]
```
