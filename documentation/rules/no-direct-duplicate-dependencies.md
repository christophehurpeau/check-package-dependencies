# Disallow dependencies that will be installed twice because a direct dependency requires an incompatible range

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

When one of your direct dependencies requires a range that your own version does not satisfy, the package manager installs both versions. Two copies of the same package mean a bigger bundle, and broken behaviour for packages relying on a shared instance (React context, singletons, `instanceof` checks).

The rule reads the `dependencies` of each of your direct dependencies and compares them with the versions declared in your `dependencies` and `devDependencies`.

While doing so, it also reports the checked dependencies declared in both `dependencies` and `devDependencies`, unless the package is a library (`library` setting) and the two values differ, which is the intended way to declare a range for consumers and an exact version for development.

Values using `latest`, `file:`, `workspace:` or `patch:`, and dependencies having an entry in `resolutions`, are ignored.

## Fail

With `some-lib` depending on `"semver": "^7.8.0"`:

```json
{
  "name": "example",
  "dependencies": {
    "some-lib": "1.0.0",
    "semver": "7.5.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "dependencies": {
    "some-lib": "1.0.0",
    "semver": "7.8.5"
  }
}
```

## Options

| Name           | Type                       | Default | Description                                                                                    |
| :------------- | :------------------------- | :------ | :--------------------------------------------------------------------------------------------- |
| `onlyWarnsFor` | `Record<string, string[]>` | `{}`    | Maps the dependency causing the duplicate (or `"*"`) to the duplicated names to only warn for. |

```js
"check-package-dependencies/no-direct-duplicate-dependencies": [
  "error",
  { onlyWarnsFor: { "*": ["type-fest"] } },
]
```
