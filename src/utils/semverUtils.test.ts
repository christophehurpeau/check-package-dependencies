import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeOperator } from "./semverUtils.ts";

describe("changeOperator", () => {
  it("should change the operator", () => {
    assert.equal(changeOperator("^1.0.1-beta", "~"), "~1.0.1-beta");
  });
});
