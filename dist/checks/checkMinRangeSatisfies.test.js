import { describe, it } from "node:test";
import { assertDeepEqualIgnoringPrototypes, assertNoMessages, assertSingleMessage, createMockReportError, } from "../reporting/ReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { checkMinRangeSatisfies } from "./checkMinRangeSatisfies.js";
describe(checkMinRangeSatisfies.name, () => {
    const { mockReportError, messages } = createMockReportError();
    it("should return no error when no dependencies is set", () => {
        checkMinRangeSatisfies(mockReportError, parsePkgValue({ name: "test" }));
        assertNoMessages(messages);
    });
    describe("expect no error", () => {
        const testCases = [
            [
                "exact dev dependency and exact dependency",
                {
                    dependencies: { test1: "1.1.0" },
                    devDependencies: { test1: "1.1.0" },
                },
            ],
            [
                "exact dev dependency and caret range dependency",
                {
                    dependencies: { test1: "^1.1.0" },
                    devDependencies: { test1: "1.1.0" },
                },
            ],
            [
                "exact dev dependency and tilde range dependency",
                {
                    dependencies: { test1: "~1.1.0" },
                    devDependencies: { test1: "1.1.0" },
                },
            ],
            [
                "exact dev dependency and >= range dependency",
                {
                    dependencies: { test1: ">=1.1.0" },
                    devDependencies: { test1: "1.1.0" },
                },
            ],
            [
                "caret range dev dependency and >= range dependency",
                {
                    dependencies: { test1: ">=1.1.0" },
                    devDependencies: { test1: "^1.1.0" },
                },
            ],
            [
                "* dependency",
                {
                    dependencies: { test1: "*" },
                    devDependencies: { test1: "^1.1.0" },
                },
            ],
        ];
        for (const [description, pkgContent] of testCases) {
            it(`should have no error when ${description}`, () => {
                checkMinRangeSatisfies(mockReportError, parsePkgValue({ name: "test", ...pkgContent }), "dependencies", "devDependencies");
                assertNoMessages(messages);
            });
        }
    });
    describe("expect error when not dependency is invalid", () => {
        const testCases = [
            [
                "exact dev dependency is higher than exact dependency",
                {
                    dependencies: { test1: "1.1.0" },
                    devDependencies: { test1: "1.0.0" },
                },
                'Invalid "1.1.0" in "dependencies"',
                '"1.1.0" should satisfies "1.0.0" from "devDependencies"',
                {
                    dependencies: { test1: "1.0.0" },
                },
            ],
            [
                "exact dev dependency is higher than caret range dependency",
                {
                    dependencies: { test1: "^1.0.0" },
                    devDependencies: { test1: "1.1.0" },
                },
                'Invalid "^1.0.0" in "dependencies"',
                '"^1.0.0" should satisfies "1.1.0" from "devDependencies"',
                {
                    dependencies: { test1: "^1.1.0" },
                },
            ],
            [
                "exact dev dependency is lower than caret range dependency",
                {
                    dependencies: { test1: "^1.1.0" },
                    devDependencies: { test1: "1.0.0" },
                },
                'Invalid "^1.1.0" in "dependencies"',
                '"^1.1.0" should satisfies "1.0.0" from "devDependencies"',
                {
                    dependencies: { test1: "^1.0.0" },
                },
            ],
            [
                "exact dev dependency is higher than tilde range dependency",
                {
                    dependencies: { test1: "~1.0.0" },
                    devDependencies: { test1: "1.1.0" },
                },
                'Invalid "~1.0.0" in "dependencies"',
                '"~1.0.0" should satisfies "1.1.0" from "devDependencies"',
                {
                    dependencies: { test1: "~1.1.0" },
                },
            ],
            [
                "exact dev dependency is lower than tilde range dependency",
                {
                    dependencies: { test1: "~1.1.0" },
                    devDependencies: { test1: "1.0.0" },
                },
                'Invalid "~1.1.0" in "dependencies"',
                '"~1.1.0" should satisfies "1.0.0" from "devDependencies"',
                {
                    dependencies: { test1: "~1.0.0" },
                },
            ],
            [
                "exact dev dependency is higher than >= range dependency",
                {
                    dependencies: { test1: ">=1.0.0" },
                    devDependencies: { test1: "1.1.0" },
                },
                'Invalid ">=1.0.0" in "dependencies"',
                '">=1.0.0" should satisfies "1.1.0" from "devDependencies"',
                {
                    dependencies: { test1: ">=1.1.0" },
                },
            ],
            [
                "exact dev dependency is lower than >= range dependency",
                {
                    dependencies: { test1: ">=1.1.0" },
                    devDependencies: { test1: "1.0.0" },
                },
                'Invalid ">=1.1.0" in "dependencies"',
                '">=1.1.0" should satisfies "1.0.0" from "devDependencies"',
                {
                    dependencies: { test1: ">=1.0.0" },
                },
            ],
        ];
        for (const [description, pkgContent, errorTitle, errorInfo, expectedFix,] of testCases) {
            it(`should error when ${description}`, () => {
                checkMinRangeSatisfies(mockReportError, parsePkgValue({ name: "test", ...pkgContent }), "dependencies", "devDependencies");
                assertSingleMessage(messages, {
                    errorMessage: errorTitle,
                    errorDetails: errorInfo,
                    dependency: {
                        name: "test1",
                        fieldName: "dependencies",
                        value: pkgContent.dependencies?.test1,
                    },
                    autoFixable: true,
                });
                if (expectedFix) {
                    const pkgValue = { name: "test", ...pkgContent };
                    const parsedPkg = parsePkgValue(pkgValue);
                    checkMinRangeSatisfies(mockReportError, parsedPkg, "dependencies", "devDependencies", { tryToAutoFix: true });
                    assertDeepEqualIgnoringPrototypes(parsedPkg.value, {
                        ...pkgValue,
                        ...expectedFix,
                    });
                }
            });
        }
    });
});
//# sourceMappingURL=checkMinRangeSatisfies.test.js.map