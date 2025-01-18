import { describe, it } from "node:test";
import { assertNoMessages, assertSingleMessage, createMockReportError, } from "../reporting/ReportError.testUtils.js";
import { checkSatisfiesVersionsInDependency } from "./checkSatisfiesVersionsInDependency.js";
describe(checkSatisfiesVersionsInDependency.name, () => {
    const { mockReportError, messages } = createMockReportError();
    it("should return no error when no ranges is set", () => {
        checkSatisfiesVersionsInDependency(mockReportError, { name: "test" }, {});
        assertNoMessages(messages);
    });
    describe("expect no error", () => {
        const testCases = [
            ["test1", "devDependencies", "not set", null, {}],
            ["test2", "dependencies", "not set", null, {}],
            ["test3", "resolutions", "not set", null, {}],
            [
                "test1",
                "devDependencies",
                "not present",
                null,
                { devDependencies: { other: "1.0.0" } },
            ],
            [
                "test2",
                "dependencies",
                "not present",
                null,
                { dependencies: { other: "1.0.0" } },
            ],
            [
                "test3",
                "resolutions",
                "not present",
                null,
                { resolutions: { other: "1.0.0" } },
            ],
            [
                "test3",
                "dependencies",
                "present in another type (devDependencies)",
                null,
                { devDependencies: { test3: "1.0.0" } },
            ],
            [
                "test3",
                "dependencies",
                "identical",
                "1.0.0",
                { dependencies: { test3: "1.0.0" } },
            ],
            [
                "test3",
                "dependencies",
                "satisfies (exact)",
                "^1.0.0",
                { dependencies: { test3: "1.1.0" } },
            ],
            [
                "test3",
                "dependencies",
                "satisfies (range)",
                "^1.0.0",
                { dependencies: { test3: "^1.1.0" } },
            ],
        ];
        for (const [depName, depType, description, depValue, pkgContent,] of testCases) {
            it(`should return no error when ${depName} in ${depType} is ${description}`, () => {
                checkSatisfiesVersionsInDependency(mockReportError, { name: "test", ...pkgContent }, { [depType]: { [depName]: depValue } });
                assertNoMessages(messages);
            });
        }
    });
    describe("expect error when not dependency is not expected", () => {
        const testCases = [
            [
                "test1",
                "devDependencies",
                { devDependencies: { test1: "1.0.0" } },
                'Invalid "test1" in "devDependencies" of "test"',
                "it should not be present",
            ],
            [
                "test2",
                "dependencies",
                { dependencies: { test2: "^1.0.0" } },
                'Invalid "test2" in "dependencies" of "test"',
                "it should not be present",
            ],
            [
                "test3",
                "resolutions",
                { resolutions: { test3: "1.x" } },
                'Invalid "test3" in "resolutions" of "test"',
                "it should not be present",
            ],
        ];
        for (const [depName, depType, pkgContent, errorTitle, errorInfo,] of testCases) {
            it(`should error when ${depName} is not expected in ${depType}`, () => {
                checkSatisfiesVersionsInDependency(mockReportError, { name: "test", ...pkgContent }, { [depType]: { [depName]: null } });
                assertSingleMessage(messages, {
                    errorMessage: errorTitle,
                    errorDetails: errorInfo,
                    dependency: { name: depName },
                });
            });
        }
    });
    describe("expect error when dependency is expected", () => {
        const testCases = [
            [
                "test1",
                "missing",
                "devDependencies",
                "1.0.0",
                {},
                'Missing "test1" in "devDependencies" of "test"',
                '"devDependencies" is missing',
            ],
            [
                "test2",
                "missing",
                "devDependencies",
                "1.0.0",
                { dependencies: {} },
                'Missing "test2" in "devDependencies" of "test"',
                '"devDependencies" is missing',
            ],
            [
                "test3",
                "missing",
                "dependencies",
                "^1.0.0",
                { dependencies: { test2: "^1.0.0" } },
                'Missing "test3" in "dependencies" of "test"',
                '"test3" is missing but should satisfies "^1.0.0"',
            ],
            [
                "test4",
                "invalid",
                "dependencies",
                "^1.0.0",
                { dependencies: { test4: "0.1.0" } },
                'Invalid "test4" in "dependencies" of "test"',
                '"0.1.0" does not satisfies "^1.0.0"',
            ],
        ];
        for (const [depName, status, depType, depRange, pkgContent, errorTitle, errorInfo,] of testCases) {
            it(`should error when ${depName} is ${status} in ${depType}`, () => {
                checkSatisfiesVersionsInDependency(mockReportError, { name: "test", ...pkgContent }, { [depType]: { [depName]: depRange } });
                assertSingleMessage(messages, {
                    errorMessage: errorTitle,
                    errorDetails: errorInfo,
                    dependency: { name: depName },
                });
            });
        }
    });
});
//# sourceMappingURL=checkSatisfiesVersionsInDependency.test.js.map