# Enforce the minimum of a `dependencies` range to satisfy the version in `devDependencies`

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

<!-- end auto-generated rule header -->

A library declares a range in `dependencies` for its consumers, and the exact version it is developed and tested with in `devDependencies`. Nothing tests the lower bound of the range, so it silently rots: when a new feature of the dependency is used, consumers installing the minimum of the range get a version that does not have it.

This rule requires the minimum version of the range in `dependencies` to satisfy the version in `devDependencies`, so the lower bound is bumped every time the development version is. The fix rewrites the range, keeping its operator.

Ranges equal to `*` are ignored, on both sides.

## Fail

```json
{
  "name": "example",
  "dependencies": {
    "semver": "^7.5.0"
  },
  "devDependencies": {
    "semver": "7.8.5"
  }
}
```

## Pass

```json
{
  "name": "example",
  "dependencies": {
    "semver": "^7.8.5"
  },
  "devDependencies": {
    "semver": "7.8.5"
  }
}
```

## Options

This rule has no options.
