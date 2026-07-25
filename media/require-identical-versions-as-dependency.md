# Require configured dependencies to have the same version as the one in the `dependencies` of another dependency

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

<!-- end auto-generated rule header -->

When a tool bundles the versions it works with — a framework CLI, a preset, a starter kit — installing a different version of one of them is a subtle way to break it. This rule reads the versions from the `dependencies` of an installed dependency and requires yours to be exactly the same.

The version read from the dependency has to be exact: a range is reported as an error, since an exact match cannot be enforced against a range. Use [satisfies-versions-from-dependencies](satisfies-versions-from-dependencies.md) in that case.

## Fail

With `react-scripts` depending on `"@babel/core": "7.28.4"`:

```json
{
  "name": "example",
  "devDependencies": {
    "react-scripts": "5.0.1",
    "@babel/core": "7.27.1"
  }
}
```

## Pass

```json
{
  "name": "example",
  "devDependencies": {
    "react-scripts": "5.0.1",
    "@babel/core": "7.28.4"
  }
}
```

## Options

| Name                      | Type                       | Default | Description                                                                                |
| :------------------------ | :------------------------- | :------ | :----------------------------------------------------------------------------------------- |
| `dependencies` (required) | `Record<string, DepGroup>` | —       | Maps a dependency name to the fields of your `package.json` to check against its versions. |
| `onlyWarnsFor`            | `string[]`                 | `[]`    | Dependency names to only warn for.                                                         |

`DepGroup` maps `dependencies`, `devDependencies` and `resolutions` to the list of dependency names to check in each of them.

```js
"check-package-dependencies/require-identical-versions-as-dependency": [
  "error",
  {
    dependencies: {
      "react-scripts": {
        devDependencies: ["@babel/core"],
        resolutions: ["@babel/core"],
      },
    },
  },
]
```
