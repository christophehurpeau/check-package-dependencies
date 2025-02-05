import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertNoMessages, assertSeveralMessages, createMockReportError, } from "../reporting/ReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { checkResolutionsVersionsMatch } from "./checkResolutionsVersionsMatch.js";
describe("checkResolutionsVersionsMatch", () => {
    const { mockReportError, messages } = createMockReportError();
    it('should return no error when no "resolutions" is present', () => {
        checkResolutionsVersionsMatch(mockReportError, parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }));
        assertNoMessages(messages);
    });
    it('should return no error when "resolutions" has dependency not in other dependencies type', () => {
        checkResolutionsVersionsMatch(mockReportError, parsePkgValue({ name: "test", resolutions: { test: "1.0.0" } }));
        assertNoMessages(messages);
    });
    it('should return no error when "resolutions" has dependency matching', () => {
        checkResolutionsVersionsMatch(mockReportError, parsePkgValue({
            name: "test",
            resolutions: {
                test1: "1.0.0",
                test2: "1.0.0",
                test3: "1.0.1",
                "test4@npm:1.1.0": "patch:1.2.0",
            },
            devDependencies: { test1: "1.0.0", test4: "1.1.0" },
            dependencies: { test2: "1.0.0", test3: "^1.0.0" },
        }));
        assertNoMessages(messages);
    });
    it("should return error when multiple dependencies not matching", () => {
        checkResolutionsVersionsMatch(mockReportError, parsePkgValue({
            name: "test",
            resolutions: {
                test1: "1.0.0",
                test2: "1.0.0",
                "test3@npm:1.1.0": "patch:1.2.0",
                "test4@npm:1.1.0": "patch:1.2.0",
            },
            devDependencies: { test1: "1.1.0" },
            dependencies: { test2: "1.2.0", test3: "1.0.0", test4: "1.2.0" },
        }));
        assertSeveralMessages(messages, [
            {
                errorMessage: 'Invalid "1.1.0"',
                errorDetails: 'expecting "1.1.0" be "1.0.0" from resolutions',
                errorTarget: "dependencyValue",
                dependency: {
                    name: "test1",
                    fieldName: "devDependencies",
                    value: "1.1.0",
                },
                suggestions: [
                    [
                        {
                            fieldName: "resolutions",
                            name: "test1",
                            value: "1.0.0",
                        },
                        "1.1.0",
                        'Fix resolutions\'s value to "1.1.0"',
                    ],
                    [
                        {
                            fieldName: "devDependencies",
                            name: "test1",
                            value: "1.1.0",
                        },
                        "1.0.0",
                        'Fix this value to resolutions\'s value "1.0.0"',
                    ],
                ],
            },
            {
                errorMessage: 'Invalid "1.2.0"',
                errorDetails: 'expecting "1.2.0" be "1.0.0" from resolutions',
                errorTarget: "dependencyValue",
                dependency: {
                    name: "test2",
                    fieldName: "dependencies",
                    value: "1.2.0",
                },
                suggestions: [
                    [
                        {
                            fieldName: "resolutions",
                            name: "test2",
                            value: "1.0.0",
                        },
                        "1.2.0",
                        'Fix resolutions\'s value to "1.2.0"',
                    ],
                    [
                        {
                            fieldName: "dependencies",
                            name: "test2",
                            value: "1.2.0",
                        },
                        "1.0.0",
                        'Fix this value to resolutions\'s value "1.0.0"',
                    ],
                ],
            },
            {
                errorMessage: 'Invalid "1.0.0"',
                errorDetails: 'expecting "1.0.0" be "1.1.0" from resolutions',
                errorTarget: "dependencyValue",
                dependency: {
                    name: "test3",
                    fieldName: "dependencies",
                    value: "1.0.0",
                },
                suggestions: [
                    [
                        {
                            fieldName: "resolutions",
                            name: "test3@npm:1.1.0",
                            value: "patch:1.2.0",
                        },
                        "1.0.0",
                        'Fix resolutions\'s value to "1.0.0"',
                    ],
                    [
                        {
                            fieldName: "dependencies",
                            name: "test3",
                            value: "1.0.0",
                        },
                        "1.1.0",
                        'Fix this value to resolutions\'s value "1.1.0"',
                    ],
                ],
            },
            {
                errorMessage: 'Invalid "1.2.0"',
                errorDetails: 'expecting "1.2.0" be "1.1.0" from resolutions',
                errorTarget: "dependencyValue",
                dependency: {
                    name: "test4",
                    fieldName: "dependencies",
                    value: "1.2.0",
                },
                suggestions: [
                    [
                        {
                            fieldName: "resolutions",
                            name: "test4@npm:1.1.0",
                            value: "patch:1.2.0",
                        },
                        "1.2.0",
                        'Fix resolutions\'s value to "1.2.0"',
                    ],
                    [
                        {
                            fieldName: "dependencies",
                            name: "test4",
                            value: "1.2.0",
                        },
                        "1.1.0",
                        'Fix this value to resolutions\'s value "1.1.0"',
                    ],
                ],
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
        checkResolutionsVersionsMatch(mockReportError, pkg, {
            tryToAutoFix: true,
        });
        assertNoMessages(messages);
        assert.equal(pkg.value.devDependencies?.test1, "1.0.0");
        assert.equal(pkg.value.dependencies?.test2, "1.0.0");
    });
});
//# sourceMappingURL=checkResolutionsVersionsMatch.test.js.map