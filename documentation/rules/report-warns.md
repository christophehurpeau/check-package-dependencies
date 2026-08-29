# Report the errors the other rules downgraded to warnings with their `onlyWarnsFor` option

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Most rules accept an [`onlyWarnsFor`](../../README.md#onlywarnsfor) option, downgrading the
errors of the listed dependencies to warnings. An ESLint rule cannot report on behalf of
another rule, so the rules that downgrade an error hand it to this one, which reports them
all as its own problems, at the location of the dependency they come from. Enabled at
`"warn"` in the `recommended` config, they are then handled like any other ESLint warning:
displayed by the formatter, hidden by `--quiet`, counted by `--max-warnings`, and left out of
the exit code.

Each message ends with the name of the rule the error was downgraded from, as the rule
reporting it is always this one.

Setting this rule to `"off"` is highly discouraged: nothing else reports the downgraded
errors, so every `onlyWarnsFor` entry becomes silent and the exceptions it grants stop being
visible. The point of downgrading an error is to keep seeing it without failing on it. To
keep the lint output free of them, use `--quiet` rather than disabling the rule.

The reported warnings carry no fix and no suggestion, so `eslint --fix` never rewrites a
dependency that was deliberately downgraded.

## Fail

With `require-pinned-versions` configured as
`["error", { onlyWarnsFor: ["type-fest"] }]`, the range of `type-fest` is reported as a
warning by this rule instead of an error by `require-pinned-versions`:

```json
{
  "name": "example",
  "devDependencies": {
    "type-fest": "^4.0.0"
  }
}
```

## Pass

```json
{
  "name": "example",
  "devDependencies": {
    "type-fest": "4.41.0"
  }
}
```

## Options

This rule has no options.
