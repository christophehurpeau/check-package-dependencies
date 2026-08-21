# Require configured dependencies to satisfy the ranges declared in the `dependencies` of another dependency

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

When you install a package that one of your dependencies also depends on, installing a version outside of the range that dependency requires either duplicates the package or breaks it. This rule reads the range from the `dependencies` of an installed dependency and requires your own version to satisfy it.

Unlike [require-identical-versions-as-dependency](require-identical-versions-as-dependency.md), the reference is a range, not an exact version, so any version inside the range is accepted.

A configured dependency missing from your `package.json` is reported, and a configured dependency missing from the reference dependency raises a check error.

## Fail

With `eslint` depending on `"@eslint/plugin-kit": "^0.7.2"`:

```json
{
  "name": "example",
  "dependencies": {
    "@eslint/plugin-kit": "0.6.0"
  },
  "devDependencies": {
    "eslint": "10.7.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "dependencies": {
    "@eslint/plugin-kit": "0.7.2"
  },
  "devDependencies": {
    "eslint": "10.7.0"
  }
}
```

## Options

| Name                      | Type                       | Default | Description                                                                                                            |
| :------------------------ | :------------------------- | :------ | :--------------------------------------------------------------------------------------------------------------------- |
| `dependencies` (required) | `Record<string, DepGroup>` | —       | Maps a dependency name to the fields of your `package.json` in which to check the dependencies it declares ranges for. |
| `comment`                 | `string`                   | —       | Explanation of what this rule is enabled for, appended to the messages it reports.                                     |

`DepGroup` maps `dependencies`, `devDependencies` and `optionalDependencies` to the list of dependency names to check in each of them. Each entry also accepts a `comment` explaining what it is configured for, which replaces the rule `comment` in the messages that entry produces.

```js
"check-package-dependencies/satisfies-versions-from-dependencies": [
  "error",
  { dependencies: { eslint: { dependencies: ["@eslint/plugin-kit"] } } },
]
```
