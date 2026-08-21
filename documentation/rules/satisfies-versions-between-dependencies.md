# Require the range of a dependency in one dependency to satisfy the range of the same dependency in another dependency

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

<!-- end auto-generated rule header -->

Two of your dependencies can depend on the same package with ranges that do not overlap. Nothing in your own `package.json` shows it, and depending on the package manager it ends up as two installed copies, or as a single one breaking the package expecting the other version. This rule compares the ranges declared by two installed dependencies for the same package.

The `from` dependency must be a direct dependency of your package, and both dependencies must declare the checked package, otherwise a check error is reported.

## Fail

With `eslint` depending on `"@eslint/core": "^1.2.0"` and `@eslint/plugin-kit` depending on `"@eslint/core": "^2.0.0"`:

```js
"check-package-dependencies/satisfies-versions-between-dependencies": [
  "error",
  {
    dependencies: [
      { name: "@eslint/core", from: "eslint", to: "@eslint/plugin-kit" },
    ],
  },
]
```

## Pass

With `eslint` and `@eslint/plugin-kit` both depending on a compatible range of `@eslint/core`.

## Options

| Name                      | Type      | Default | Description                                                                        |
| :------------------------ | :-------- | :------ | :--------------------------------------------------------------------------------- |
| `dependencies` (required) | `Check[]` | —       | The comparisons to run.                                                            |
| `comment`                 | `string`  | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |

Each `Check` has:

| Name      | Type                                                                                             | Description                                                                                                |
| :-------- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `name`    | `string`                                                                                         | The dependency whose ranges are compared.                                                                  |
| `from`    | `string \| { name: string, in?: "dependencies" \| "devDependencies" \| "optionalDependencies" }` | The dependency declaring the range that must satisfy the other one. `in` defaults to `dependencies`.       |
| `to`      | `string \| { name: string, in?: "dependencies" \| "devDependencies" \| "optionalDependencies" }` | The dependency declaring the range to satisfy. `in` defaults to `dependencies`.                            |
| `comment` | `string`                                                                                         | What the comparison is configured for, appended to the messages it produces instead of the rule `comment`. |

```js
"check-package-dependencies/satisfies-versions-between-dependencies": [
  "error",
  {
    dependencies: [
      {
        name: "@eslint/core",
        from: "eslint",
        to: { name: "@eslint/plugin-kit", in: "dependencies" },
      },
    ],
  },
]
```
