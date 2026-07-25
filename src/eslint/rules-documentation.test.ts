import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

const scriptPath = path.join(
  import.meta.dirname,
  "../../scripts/generate-rules-docs.js",
);

test("rules documentation and readme rules list are up to date", () => {
  const result = spawnSync(process.execPath, [scriptPath, "--check"], {
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `${result.stdout}${result.stderr}Run "pnpm run generate:rules-docs" to update the generated parts, and edit documentation/rules/*.md for the rest.`,
  );
});
