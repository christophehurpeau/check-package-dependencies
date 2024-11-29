import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCheckPackage, createCheckPackageWithWorkspaces, } from "./index.js";
describe("exports", () => {
    const testCases = [
        ["createCheckPackage", createCheckPackage],
        ["createCheckPackageWithWorkspaces", createCheckPackageWithWorkspaces],
    ];
    for (const [name, fn] of testCases) {
        it(`${name} should be defined`, () => {
            assert.ok(fn);
        });
    }
});
//# sourceMappingURL=index.test.js.map