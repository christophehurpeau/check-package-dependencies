import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertCreateReportErrorCall, assertNoMessages, assertSeveralMessages, createMockReportError, } from "../utils/createReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { checkResolutionsVersionsMatch } from "./checkResolutionsVersionsMatch.js";
describe("checkResolutionsVersionsMatch", () => {
    const { createReportError, messages } = createMockReportError();
    it('should return no error when no "resolutions" is present', () => {
        checkResolutionsVersionsMatch(parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }), { customCreateReportError: createReportError });
        assertCreateReportErrorCall(createReportError, "Resolutions match other dependencies");
        assertNoMessages(messages);
    });
    it('should return no error when "resolutions" has dependency not in other dependencies type', () => {
        checkResolutionsVersionsMatch(parsePkgValue({ name: "test", resolutions: { test: "1.0.0" } }), { customCreateReportError: createReportError });
        assertCreateReportErrorCall(createReportError, "Resolutions match other dependencies");
        assertNoMessages(messages);
    });
    it('should return no error when "resolutions" has dependency matching', () => {
        checkResolutionsVersionsMatch(parsePkgValue({
            name: "test",
            resolutions: {
                test1: "1.0.0",
                test2: "1.0.0",
                test3: "1.0.1",
                "test4@npm:1.1.0": "patch:1.2.0",
            },
            devDependencies: { test1: "1.0.0", test4: "1.1.0" },
            dependencies: { test2: "1.0.0", test3: "^1.0.0" },
        }), { customCreateReportError: createReportError });
        assertCreateReportErrorCall(createReportError, "Resolutions match other dependencies");
        assertNoMessages(messages);
    });
    it("should return error when multiple dependencies not matching", () => {
        checkResolutionsVersionsMatch(parsePkgValue({
            name: "test",
            resolutions: {
                test1: "1.0.0",
                test2: "1.0.0",
                "test3@npm:1.1.0": "patch:1.2.0",
                "test4@npm:1.1.0": "patch:1.2.0",
            },
            devDependencies: { test1: "1.1.0" },
            dependencies: { test2: "1.2.0", test3: "1.0.0", test4: "1.2.0" },
        }), { customCreateReportError: createReportError });
        assertCreateReportErrorCall(createReportError, "Resolutions match other dependencies");
        assertSeveralMessages(messages, [
            {
                errorMessage: 'Invalid "1.1.0"',
                errorDetails: 'expecting "1.1.0" be "1.0.0" from resolutions',
                dependency: {
                    name: "test1",
                    fieldName: "devDependencies",
                    value: "1.1.0",
                },
                autoFixable: true,
            },
            {
                errorMessage: 'Invalid "1.2.0"',
                errorDetails: 'expecting "1.2.0" be "1.0.0" from resolutions',
                dependency: {
                    name: "test2",
                    fieldName: "dependencies",
                    value: "1.2.0",
                },
                autoFixable: true,
            },
            {
                errorMessage: 'Invalid "1.0.0"',
                errorDetails: 'expecting "1.0.0" be "1.1.0" from resolutions',
                dependency: {
                    name: "test3",
                    fieldName: "dependencies",
                    value: "1.0.0",
                },
                autoFixable: true,
            },
            {
                errorMessage: 'Invalid "1.2.0"',
                errorDetails: 'expecting "1.2.0" be "1.1.0" from resolutions',
                dependency: {
                    name: "test4",
                    fieldName: "dependencies",
                    value: "1.2.0",
                },
                autoFixable: true,
            },
        ]);
    });
    it('should fix without error when "resolutions" has dependency not matching', () => {
        const pkg = parsePkgValue({
            name: "test",
            resolutions: { test1: "1.0.0", test2: "1.0.0" },
            devDependencies: { test1: "1.1.0" },
            dependencies: { test2: "1.2.0" },
        });
        checkResolutionsVersionsMatch(pkg, {
            customCreateReportError: createReportError,
            tryToAutoFix: true,
        });
        assertCreateReportErrorCall(createReportError, "Resolutions match other dependencies");
        assertNoMessages(messages);
        assert.equal(pkg.value.devDependencies?.test1, "1.0.0");
        assert.equal(pkg.value.dependencies?.test2, "1.0.0");
    });
});
//# sourceMappingURL=checkResolutionsVersionsMatch.test.js.map