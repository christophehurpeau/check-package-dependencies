import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCheckPackage,
  createCheckPackageWithWorkspaces,
} from "./index.ts";

describe("exports", () => {
  const testCases: [string, unknown][] = [
    ["createCheckPackage", createCheckPackage],
    ["createCheckPackageWithWorkspaces", createCheckPackageWithWorkspaces],
  ];

  for (const [name, fn] of testCases) {
    it(`${name} should be defined`, () => {
      assert.ok(fn);
    });
  }
});
