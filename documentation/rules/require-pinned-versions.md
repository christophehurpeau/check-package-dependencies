# Require pinned versions in `dependencies`, `devDependencies` and `resolutions`

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Ranges (`^`, `~`, `>`, `<`) let two installs of the same commit resolve to different versions. Pinned versions make installs reproducible and make every dependency update an explicit commit, which is what you want when [renovate](https://docs.renovatebot.com/) or dependabot opens one pull request per update.

`dependencies` is the exception for a library: its ranges are what lets consumers deduplicate them, so they are only checked when the package is not a library. `devDependencies` and `resolutions` are always checked, as they never reach a consumer. See the [`library` setting](../../README.md#settings).

| Dependency field  | `library: false` | `library: true` |
| :---------------- | :--------------- | :-------------- |
| `dependencies`    | pinned           | range or not    |
| `devDependencies` | pinned           | pinned          |
| `resolutions`     | pinned           | pinned          |

The fix replaces the range with the version currently installed in `node_modules`, and only when that version satisfies the range.

## Fail

```json
{
  "name": "example",
  "devDependencies": {
    "eslint": "^10.7.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "devDependencies": {
    "eslint": "10.7.0"
  }
}
```

## Options

| Name           | Type           | Default | Description                                                                        |
| :------------- | :------------- | :------ | :--------------------------------------------------------------------------------- |
| `onlyWarnsFor` | `OnlyWarnsFor` | `[]`    | Dependency names to only warn for.                                                 |
| `comment`      | `string`       | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |

`OnlyWarnsFor` is a list of dependency names, each optionally written as `{ name, comment }` — see [`onlyWarnsFor`](../../README.md#onlywarnsfor).

```js
"check-package-dependencies/require-pinned-versions": [
  "error",
  { onlyWarnsFor: ["type-fest"] },
]
```
