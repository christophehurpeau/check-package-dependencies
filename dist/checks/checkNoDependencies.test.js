import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockReportError } from "../utils/createReportError.testUtils.js";
import { checkNoDependencies } from "./checkNoDependencies.js";
describe("checkNoDependencies", () => {
    const { mockReportError, createReportError } = createMockReportError();
    it('should return no error when no "dependencies" is present', () => {
        checkNoDependencies({ name: "test", devDependencies: { test: "1.0.0" } }, "path", undefined, undefined, createReportError);
        assert.equal(mockReportError.mock.calls.length, 0);
    });
    it('should return no error when no "devDependencies" is present', () => {
        checkNoDependencies({ name: "test", dependencies: { test: "1.0.0" } }, "path", "devDependencies", undefined, createReportError);
        assert.equal(mockReportError.mock.calls.length, 0);
    });
    it('should return no error when "dependencies" is present', () => {
        checkNoDependencies({ name: "test", dependencies: { test: "1.0.0" } }, "path", undefined, undefined, createReportError);
        assert.equal(createReportError.mock.calls.length, 1);
        assert.deepEqual(createReportError.mock.calls[0].arguments, [
            "No dependencies",
            "path",
        ]);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments, [
            "Unexpected dependencies",
            "you should move them in devDependencies",
        ]);
    });
    it('should return no error when "dependencies" is present and is in onlyWarnsFor', () => {
        checkNoDependencies({ name: "test", dependencies: { test: "1.0.0" } }, "path", "dependencies", "peerDependencies", createReportError);
        assert.equal(createReportError.mock.calls.length, 1);
        assert.deepEqual(createReportError.mock.calls[0].arguments, [
            "No dependencies",
            "path",
        ]);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments, [
            "Unexpected dependencies",
            "you should move them in peerDependencies",
        ]);
    });
});
//# sourceMappingURL=checkNoDependencies.test.js.map