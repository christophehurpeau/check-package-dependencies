# Enforce consistent dependency versions across the packages of a workspace

💼 This rule is enabled in the ✅ `recommended` and 📚 `recommended-library` configs.

<!-- end auto-generated rule header -->

In a workspace, two packages declaring incompatible versions of the same dependency get two copies installed, with the same consequences as [no-direct-duplicate-dependencies](no-direct-duplicate-dependencies.md), plus the confusion of a tool behaving differently depending on the package it runs from.

The rule behaves differently depending on the `package.json` being linted:

- on the **workspace root**, every workspace package is compared with the root and with the workspace packages already checked, reporting dependencies that would be installed twice;
- on a **workspace package**, the peer dependencies of its own dependencies are checked against the `devDependencies` of the workspace root, which is where a workspace package usually gets them from. The ones already declared by the package itself are left to [require-direct-peer-dependencies](require-direct-peer-dependencies.md).

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

`packages/app/package.json`:

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

This rule has no options.
