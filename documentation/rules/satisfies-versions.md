# Require configured dependencies to be present and to satisfy the configured ranges

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Locks a dependency inside a range you decide, without pinning it to an exact version. Useful to keep a dependency on a major version you support, to enforce a minimum version fixing a known bug, or to prevent an automated update from moving past a version you have not migrated to yet.

A dependency configured but absent from the `package.json` is reported as missing.

## Fail

```json
{
  "name": "example",
  "devDependencies": {
    "eslint": "9.0.0"
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

| Name                   | Type                     | Default | Description                                  |
| :--------------------- | :----------------------- | :------ | :------------------------------------------- |
| `dependencies`         | `Record<string, string>` | `{}`    | Ranges to satisfy in `dependencies`.         |
| `devDependencies`      | `Record<string, string>` | `{}`    | Ranges to satisfy in `devDependencies`.      |
| `optionalDependencies` | `Record<string, string>` | `{}`    | Ranges to satisfy in `optionalDependencies`. |
| `onlyWarnsFor`         | `string[]`               | `[]`    | Dependency names to only warn for.           |

At least one of `dependencies` and `devDependencies` has to be configured.

```js
"check-package-dependencies/satisfies-versions": [
  "error",
  { devDependencies: { eslint: "^10.0.0" } },
]
```
