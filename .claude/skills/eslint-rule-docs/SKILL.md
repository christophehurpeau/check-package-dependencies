---
name: eslint-rule-docs
description: Document an ESLint rule of this plugin. Use when adding a rule, renaming a rule, changing a rule's options/schema/behaviour, changing which config enables a rule, or when "pnpm run generate:rules-docs:check" / the rules-documentation test fails.
---

# ESLint rule documentation

Every rule of `src/eslint/rules/` has a documentation file in `documentation/rules/<rule-name>.md` and a row in the rules table of `README.md`. Both are partly generated from the rule metadata by `scripts/generate-rules-docs.js`, and `src/eslint/rules-documentation.test.ts` fails when they are out of date.

## Rule metadata

`createPackageRule` takes the metadata in its third argument:

```ts
export const someRule = createPackageRule(
  "some-rule",
  {
    /* JSON schema of the options */
  },
  {
    docs: {
      description: "Require something", // sentence case, no trailing dot, backticks around package.json fields
      recommended: true, // MUST match the "recommended" config in src/eslint-plugin.ts
    },
    fixable: true, // only if the rule reports errors with "fixTo"
    hasSuggestions: true, // only if the rule reports errors with "suggestions"
    checkDependencyValue: () => {},
  },
);
```

`fixable` and `hasSuggestions` are declared to ESLint: a rule reporting a fix without declaring it throws at lint time, and a rule declaring one it never produces misleads editors. `checkDependencyValue` fixes the value it is called on. `checkPackage` produces a fix only for an error carrying `errorTarget: "dependencyValue"` and the `dependency` it applies to, as `consistent-workspace-dependencies` does; any other error of that path is reported without a fix even when the underlying check passes a `fixTo`.

`docs.recommended` is validated against `configs.recommended` of `src/eslint-plugin.ts`, the only config enabling rules. A rule that checks a library differently, or only applies to one of the two, is still enabled in `recommended` and gates on the `isLibrary` param itself (resolved from the `library` setting) — that condition belongs in the documentation body, not in a config.

`configs.recommended` is also what the cli (`src/cli.ts`) runs, so adding a rule to it, or removing one from it, changes what `npx check-package-dependencies` reports: say so in the commit message, and add a changelog-worthy note to the README migration section when it is a breaking change for cli users.

## Workflow

1. Add or update the rule and its `docs` metadata, and update `src/eslint-plugin.ts` if the rule belongs to a config.
2. Run `pnpm run generate:rules-docs`. It creates missing documentation files from a stub, rewrites the header of the existing ones, and rewrites the rules table of `README.md`.
3. Write the body of `documentation/rules/<rule-name>.md`, everything below `<!-- end auto-generated rule header -->`. Never edit above that marker, nor the `README.md` rules table: they are overwritten.
4. Run `pnpm run generate:rules-docs:check` and the tests.

## Documentation file structure

Below the generated header, in this order:

- **Why the rule exists**: the concrete problem it prevents (duplicated package in the tree, non reproducible install, broken peer dependency…), then what it checks. Mention what it ignores (`workspace:`, `patch:`, `file:`, `latest`, `*`, optional peer dependencies…) and how the `library` setting changes the behaviour, when it applies.
- **`## Fail`**: a minimal `package.json` triggering the rule. When the error depends on another package, introduce the snippet with a sentence stating the relevant part of that package, such as "With some-lib depending on semver ^7.8.0:". For a rule that is only configuration-driven, show the rule configuration instead.
- **`## Pass`**: the same example, fixed.
- **`## Options`**: a table with `Name`, `Type`, `Default`, `Description` describing exactly the JSON schema of the rule — required options are marked `(required)` with `—` as default. Then a `js` snippet of a realistic configuration. Write `This rule has no options.` when the schema has no property.

Link related rules with relative links (`[require-pinned-versions](require-pinned-versions.md)`).

Never write "application" for the false side of the `library` setting: a monorepo root or a private package is not a library and not an application either. Write "a package that is not a library", or head the columns of a behaviour table with `library: false` / `library: true`.

Keep the description of the rule, the H1 (generated from it) and the `README.md` row consistent — they all come from `docs.description`.

## Renaming or deleting a rule

Rename or delete `documentation/rules/<rule-name>.md` too: the check reports documentation files that no longer match a rule.
