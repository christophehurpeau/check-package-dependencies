# Require `resolutions` versions to match the versions in `dependencies` and `devDependencies`

💼 This rule is enabled in the ✅ `recommended` config.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

A resolution applies to the whole dependency tree, including your own direct dependency. When the version of a resolution does not satisfy the version declared in `dependencies` or `devDependencies`, the installed version is not the one your `package.json` describes.

There is no automatic fix, as the mistake can be on either side. Two suggestions are offered instead: one aligning the resolution on the dependency, the other aligning the dependency on the resolution.

Resolutions using the [`patch:`](https://yarnpkg.com/features/patching) protocol are compared with the version embedded in the resolution key (`name@npm:version`).

## Fail

```json
{
  "name": "example",
  "devDependencies": {
    "semver": "7.8.5"
  },
  "resolutions": {
    "semver": "7.7.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "devDependencies": {
    "semver": "7.8.5"
  },
  "resolutions": {
    "semver": "7.8.5"
  }
}
```

## Options

| Name      | Type     | Default | Description                                                                        |
| :-------- | :------- | :------ | :--------------------------------------------------------------------------------- |
| `comment` | `string` | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |
