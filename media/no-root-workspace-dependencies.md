# Disallow `dependencies` in the root package.json of a workspace

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

The root `package.json` of a workspace is never published and never imported: it only holds the tooling shared by the workspace packages. A runtime dependency declared there is not declared by the package actually importing it, which breaks that package once published or deployed on its own.

The rule only applies to a `package.json` declaring workspaces (`workspaces` field, or `pnpm-workspace.yaml`).

## Fail

```json
{
  "name": "monorepo-root",
  "workspaces": ["packages/*"],
  "dependencies": {
    "semver": "7.8.5"
  }
}
```

## Pass

```json
{
  "name": "monorepo-root",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "eslint": "10.7.0"
  }
}
```

## Options

| Name      | Type     | Default | Description                                                                        |
| :-------- | :------- | :------ | :--------------------------------------------------------------------------------- |
| `comment` | `string` | —       | Explanation of what this rule is enabled for, appended to the messages it reports. |
