# Enforce consistent dependency versions across the packages of a workspace

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

<!-- end auto-generated rule header -->

In a workspace, two packages declaring incompatible versions of the same dependency get two copies installed, with the same consequences as [no-direct-duplicate-dependencies](no-direct-duplicate-dependencies.md), plus the confusion of a tool behaving differently depending on the package it runs from.

Every `package.json` of the workspace is compared with all the others: the workspace root with each of its packages, and each package with the root and with the other packages. A conflict is reported on the package whose range has to be raised, in the file declaring it, so that it is reported once and where `--fix` can raise it to the other range. Nothing is reported on the package that already has the higher range.

`dependencies` and `devDependencies` are compared with each other, as a package installed for development and one installed for production are the same installed copy; `peerDependencies` are only compared with `peerDependencies`.

Ranges that cannot be ordered have no range to raise, and are reported without a fix: an npm alias installing another package under the same name, a range that is not valid semver such as a dist tag, and the degenerate ranges no version satisfies. The workspace root is never the package such a conflict is reported on, and between two packages of the workspace it is the one whose name sorts first, so it is still reported exactly once.

Values that do not describe a published range are ignored, as in the other duplicate checks: `latest`, `workspace:`, `file:` and `patch:`, as well as a dependency covered by a `resolutions` entry.

On a workspace package, the rule additionally checks the peer dependencies of its own dependencies against the `devDependencies` of the workspace root, which is where a workspace package usually gets them from. The ones already declared by the package itself are left to [require-direct-peer-dependencies](require-direct-peer-dependencies.md).

Each package is checked as a library or not by resolving the [`library` setting](../../README.md#settings) against itself: with the default `"auto"` a private package is not a library, and a list of package name patterns lets a single config classify every package of the workspace.

## Fail

Root `package.json`:

```json
{
  "name": "monorepo-root",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "typescript": "6.0.3"
  }
}
```

`packages/app/package.json`, reported and fixable to `6.0.3`:

```json
{
  "name": "@example/app",
  "devDependencies": {
    "typescript": "5.9.2"
  }
}
```

## Pass

Root `package.json`:

```json
{
  "name": "monorepo-root",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "typescript": "6.0.3"
  }
}
```

`packages/app/package.json`:

```json
{
  "name": "@example/app",
  "devDependencies": {
    "typescript": "6.0.3"
  }
}
```

## Options

| Name      | Type     | Default | Description                                                                        |
| :-------- | :------- | :------ | :--------------------------------------------------------------------------------- |
| `comment` | `string` | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |
