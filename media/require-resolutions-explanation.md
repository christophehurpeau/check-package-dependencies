# Require every entry of `resolutions` to be explained in `resolutionsExplained`

💼 This rule is enabled in the ✅ `recommended` and 📚 `recommended-library` configs.

<!-- end auto-generated rule header -->

A resolution overrides the version resolved by the package manager. It is usually a temporary workaround, and without a note nobody remembers why it was added, nor when it can be removed. This rule requires a matching entry in the non-standard `resolutionsExplained` field for every entry of `resolutions`, and reports entries of `resolutionsExplained` that no longer have a resolution.

## Fail

```json
{
  "name": "example",
  "resolutions": {
    "semver": "7.8.5"
  }
}
```

```json
{
  "name": "example",
  "resolutionsExplained": {
    "semver": "Waiting for some-lib to support semver 7"
  }
}
```

## Pass

```json
{
  "name": "example",
  "resolutions": {
    "semver": "7.8.5"
  },
  "resolutionsExplained": {
    "semver": "Waiting for some-lib to support semver 7, see https://github.com/example/some-lib/issues/1"
  }
}
```

## Options

This rule has no options.
