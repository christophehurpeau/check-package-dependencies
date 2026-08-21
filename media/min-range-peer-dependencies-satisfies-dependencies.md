# Enforce the minimum of a `peerDependencies` range to satisfy the version in `dependencies`

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Same idea as [min-range-dependencies-satisfies-dev-dependencies](min-range-dependencies-satisfies-dev-dependencies.md), for a package declaring a dependency both as a peer dependency and as a regular dependency: the minimum of the `peerDependencies` range must satisfy the range declared in `dependencies`, otherwise a consumer providing the minimum peer version gets a version older than the one the package actually depends on.

The fix rewrites the `peerDependencies` range, keeping its operator. Ranges equal to `*` are ignored, on both sides. A package that is not a library is checked the same way: the mismatch is wrong whether or not the package is published.

## Fail

```json
{
  "name": "example",
  "dependencies": {
    "semver": "^7.8.5"
  },
  "peerDependencies": {
    "semver": "^7.5.0"
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
  "peerDependencies": {
    "semver": "^7.8.5"
  }
}
```

## Options

| Name      | Type     | Default | Description                                                                        |
| :-------- | :------- | :------ | :--------------------------------------------------------------------------------- |
| `comment` | `string` | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |
