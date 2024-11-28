import { describe, expect, it } from "vitest";
import { changeOperator } from "./semverUtils.js";
describe("changeOperator", () => {
    it("should change the operator", () => {
        expect(changeOperator("^1.0.1-beta", "~")).toBe("~1.0.1-beta");
    });
});
//# sourceMappingURL=semverUtils.test.js.map