import { describe, expect, it } from "vitest";
import { changeOperator } from "./semverUtils.ts";

describe("changeOperator", () => {
  it("should change the operator", () => {
    expect(changeOperator("^1.0.1-beta", "~")).toBe("~1.0.1-beta");
  });
});
