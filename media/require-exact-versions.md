# Require exact versions in `dependencies`, `devDependencies` and `resolutions`

💼 This rule is enabled in the ✅ `recommended` and 📚 `recommended-library` configs.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Ranges (`^`, `~`, `>`, `<`) let two installs of the same commit resolve to different versions. Exact versions make installs reproducible and make every dependency update an explicit commit, which is what you want when [renovate](https://docs.renovatebot.com/) or dependabot opens one pull request per update.

A published library is the exception: its `dependencies` should keep ranges so that consumers can deduplicate them. The `recommended-library` config therefore enables this rule with `{ "dependencies": false }`.

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

| Name              | Type       | Default | Description                        |
| :---------------- | :--------- | :------ | :--------------------------------- |
| `dependencies`    | `boolean`  | `true`  | Check `dependencies`.              |
| `devDependencies` | `boolean`  | `true`  | Check `devDependencies`.           |
| `resolutions`     | `boolean`  | `true`  | Check `resolutions`.               |
| `onlyWarnsFor`    | `string[]` | `[]`    | Dependency names to only warn for. |

```js
"check-package-dependencies/require-exact-versions": [
  "error",
  { dependencies: false, onlyWarnsFor: ["type-fest"] },
]
```
