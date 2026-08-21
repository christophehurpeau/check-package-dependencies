# Require dependencies on other packages of the workspace to use the `workspace:` protocol

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Referencing a workspace package by version range works only as long as the range keeps matching the local version: as soon as the local package is bumped past the range, the package manager silently installs the published version from the registry instead of linking the local one. The [`workspace:` protocol](https://yarnpkg.com/features/workspaces#workspace-ranges-workspace) always links the local package, and is replaced by a real range at publish time.

The rule checks `dependencies`, `devDependencies`, `optionalDependencies` and `peerDependencies` of every package of the workspace, and only for names that are workspace members.

The fix keeps the operator of the current value: `^1.0.0` becomes `workspace:^`, `~1.0.0` becomes `workspace:~`, anything else becomes `workspace:*`.

## Fail

With `@example/utils` being a package of the workspace:

```json
{
  "name": "@example/app",
  "dependencies": {
    "@example/utils": "^1.0.0"
  }
}
```

## Pass

```json
{
  "name": "@example/app",
  "dependencies": {
    "@example/utils": "workspace:^"
  }
}
```

## Options

| Name      | Type     | Default | Description                                                                        |
| :-------- | :------- | :------ | :--------------------------------------------------------------------------------- |
| `comment` | `string` | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |
