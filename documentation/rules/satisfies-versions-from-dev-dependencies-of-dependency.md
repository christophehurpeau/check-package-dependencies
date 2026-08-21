# Require configured dependencies to satisfy the ranges declared in the `devDependencies` of another dependency

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Same as [satisfies-versions-from-dependencies](satisfies-versions-from-dependencies.md), but the ranges are read from the `devDependencies` of the installed dependency instead of its `dependencies`.

This is the rule to use with a shared config package: an ESLint config, a TypeScript config or a build preset declares in its own `devDependencies` the versions of the tools it is developed and tested against, while its consumers install those tools themselves.

A configured dependency missing from your `package.json` is reported, and a configured dependency missing from the reference dependency's `devDependencies` raises a check error.

## Fail

With `@pob/eslint-config` having `"eslint": "^10.6.0"` in its `devDependencies`:

```json
{
  "name": "example",
  "devDependencies": {
    "@pob/eslint-config": "65.6.0",
    "eslint": "9.0.0"
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

| Name                      | Type                       | Default | Description                                                                                                            |
| :------------------------ | :------------------------- | :------ | :--------------------------------------------------------------------------------------------------------------------- |
| `dependencies` (required) | `Record<string, DepGroup>` | —       | Maps a dependency name to the fields of your `package.json` in which to check the dependencies it declares ranges for. |
| `comment`                 | `string`                   | —       | Explanation of what this rule is enabled for, appended to the messages it reports.                                     |

`DepGroup` maps `dependencies`, `devDependencies` and `optionalDependencies` to the list of dependency names to check in each of them. Each entry also accepts a `comment` explaining what it is configured for, which replaces the rule `comment` in the messages that entry produces.

```js
"check-package-dependencies/satisfies-versions-from-dev-dependencies-of-dependency": [
  "error",
  { dependencies: { "@pob/eslint-config": { devDependencies: ["eslint"] } } },
]
```
