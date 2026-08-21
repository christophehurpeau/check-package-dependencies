# Require configured dependencies to have the same version as the one in the `devDependencies` of another dependency

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

<!-- end auto-generated rule header -->

Same as [require-identical-versions-as-dependency](require-identical-versions-as-dependency.md), but the reference versions are read from the `devDependencies` of the installed dependency instead of its `dependencies`.

This is useful for a shared config package that pins in its own `devDependencies` the versions of the tools its consumers are expected to install, such as an ESLint config pinning the ESLint version it is tested with.

The version read from the dependency has to be exact: a range is reported as an error. Use [satisfies-versions-from-dev-dependencies-of-dependency](satisfies-versions-from-dev-dependencies-of-dependency.md) in that case.

## Fail

With `@pob/eslint-config` having `"eslint": "10.7.0"` in its `devDependencies`:

```json
{
  "name": "example",
  "devDependencies": {
    "@pob/eslint-config": "65.6.0",
    "eslint": "10.6.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "devDependencies": {
    "@pob/eslint-config": "65.6.0",
    "eslint": "10.7.0"
  }
}
```

## Options

| Name                      | Type                       | Default | Description                                                                                |
| :------------------------ | :------------------------- | :------ | :----------------------------------------------------------------------------------------- |
| `dependencies` (required) | `Record<string, DepGroup>` | —       | Maps a dependency name to the fields of your `package.json` to check against its versions. |
| `onlyWarnsFor`            | `OnlyWarnsFor`             | `[]`    | Dependency names to only warn for.                                                         |
| `comment`                 | `string`                   | —       | Explanation of what this rule is enabled for, appended to the messages it reports.         |

`DepGroup` maps `dependencies`, `devDependencies` and `resolutions` to the list of dependency names to check in each of them. Each entry also accepts a `comment` explaining what it is configured for, which replaces the rule `comment` in the messages that entry produces.

`OnlyWarnsFor` is a list of dependency names, each optionally written as `{ name, comment }` — see [`onlyWarnsFor`](../../README.md#onlywarnsfor).

```js
"check-package-dependencies/require-identical-versions-as-dev-dependency-of-dependency": [
  "error",
  {
    dependencies: {
      "@pob/eslint-config": { devDependencies: ["eslint"] },
    },
  },
]
```
