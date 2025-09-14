import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeOperator, getRealVersion } from "./semverUtils.js";
describe("changeOperator", () => {
    it("should change the operator", () => {
        assert.equal(changeOperator("^1.0.1-beta", "~"), "~1.0.1-beta");
    });
});
describe("getRealVersion", () => {
    it("should get the real version", () => {
        assert.equal(getRealVersion("1.0.1-beta"), "1.0.1-beta");
    });
    it("should get the real version from a workspace version", () => {
        assert.equal(getRealVersion("workspace:1.0.1-beta"), "1.0.1-beta");
    });
    it("should get the real version from a npm version", () => {
        assert.equal(getRealVersion("npm:pkg@1.0.1-beta"), "1.0.1-beta");
    });
    it("should get the real version from a npm version with scope", () => {
        assert.equal(getRealVersion("npm:@scope/pkg@1.0.1-beta"), "1.0.1-beta");
    });
});
//# sourceMappingURL=semverUtils.test.js.map