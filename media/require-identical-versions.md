# Require configured dependencies to have the same version as another dependency of the same package.json

🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.

<!-- end auto-generated rule header -->

Some packages are only meant to be used together, and mixing their versions breaks at runtime rather than at install time: `react` and `react-dom`, `@babel/core` and its plugins, an ESLint plugin and its parser… This rule locks the version of such packages on the version of a reference dependency of the same `package.json`.

An error is also reported when the reference dependency is missing, or when one of the locked dependencies is missing.

## Fail

```json
{
  "name": "example",
  "dependencies": {
    "react": "19.2.0",
    "react-dom": "19.1.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "dependencies": {
    "react": "19.2.0",
    "react-dom": "19.2.0"
  }
}
```

## Options

| Name              | Type                        | Default | Description                                         |
| :---------------- | :-------------------------- | :------ | :-------------------------------------------------- |
| `dependencies`    | `Record<string, DepConfig>` | `{}`    | Reference dependencies read from `dependencies`.    |
| `devDependencies` | `Record<string, DepConfig>` | `{}`    | Reference dependencies read from `devDependencies`. |
| `resolutions`     | `Record<string, DepConfig>` | `{}`    | Reference dependencies read from `resolutions`.     |
| `onlyWarnsFor`    | `string[]`                  | `[]`    | Reference dependency names to only warn for.        |

`DepConfig` is either an array of dependency names — looked up in the same field as the reference dependency — or an object mapping `dependencies`, `devDependencies` and `resolutions` to the names to check in each of them.

```js
"check-package-dependencies/require-identical-versions": [
  "error",
  {
    dependencies: {
      react: {
        dependencies: ["react-dom"],
        devDependencies: ["react-test-renderer"],
      },
    },
  },
]
```
