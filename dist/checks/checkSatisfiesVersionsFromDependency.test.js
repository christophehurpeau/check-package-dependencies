import { describe, it } from "node:test";
import { assertCreateReportErrorCall, assertDeepEqualIgnoringPrototypes, assertNoMessages, assertSingleMessage, createMockReportError, } from "../utils/createReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { checkSatisfiesVersionsFromDependency } from "./checkSatisfiesVersionsFromDependency.js";
describe(checkSatisfiesVersionsFromDependency.name, () => {
    const { createReportError, messages } = createMockReportError();
    it("should return no error when no keys", () => {
        checkSatisfiesVersionsFromDependency(parsePkgValue({ name: "test" }), "dependencies", [], { name: "depTest", dependencies: {} }, "dependencies", {
            customCreateReportError: createReportError,
            shouldHaveExactVersions: () => false,
        });
        assertCreateReportErrorCall(createReportError, "Satisfies Versions From Dependency");
        assertNoMessages(messages);
    });
    describe("expect no error", () => {
        const testCases = [
            ["test1", "devDependencies", "is exact", "1.0.0", "1.0.0"],
            ["test2", "devDependencies", "is in range (^)", "1.0.0", "1.0.0"],
            [
                "test3",
                "devDependencies",
                "is range (^) in range (^), when same",
                "^1.0.0",
                "^1.0.0",
            ],
            [
                "test4",
                "devDependencies",
                "is range (^) in range (^), when higher",
                "^1.0.0",
                "^1.0.1",
            ],
            ["test5", "dependencies", "is exact", "1.0.0", "1.0.0"],
            ["test6", "resolutions", "is exact", "1.0.0", "1.0.0"],
        ];
        for (const [depName, depTypeInDep, description, depValueInDep, depValueInPkg,] of testCases) {
            it(`should return no error when ${depName} in ${depTypeInDep} ${description}`, () => {
                const depTypeInPkg = "devDependencies";
                const parsedPkg = parsePkgValue({
                    name: "test",
                    ...(depValueInPkg
                        ? { [depTypeInPkg]: { [depName]: depValueInPkg } }
                        : {}),
                });
                checkSatisfiesVersionsFromDependency(parsedPkg, depTypeInPkg, [depName], {
                    name: "test-dep",
                    [depTypeInDep]: { [depName]: depValueInDep },
                }, depTypeInDep, {
                    customCreateReportError: createReportError,
                    shouldHaveExactVersions: () => false,
                });
                assertCreateReportErrorCall(createReportError, "Satisfies Versions From Dependency");
                assertNoMessages(messages);
            });
        }
    });
    describe("expect to fix", () => {
        const fixTestCases = [
            [
                '"devDependencies" missing',
                "1.0.1",
                {},
                { devDependencies: { expectedDep: "1.0.1" } },
                true,
            ],
            [
                "dependency missing",
                "1.0.1",
                { devDependencies: { otherPackage: "1.0.0" } },
                { devDependencies: { otherPackage: "1.0.0", expectedDep: "1.0.1" } },
                true,
            ],
            [
                "invalid version",
                "1.0.1",
                { devDependencies: { expectedDep: "1.0.0" } },
                { devDependencies: { expectedDep: "1.0.1" } },
                true,
            ],
            [
                "expects exact versions with missing version",
                "1.0.1",
                { devDependencies: {} },
                { devDependencies: { expectedDep: "1.0.1" } },
                true,
            ],
            [
                "expects range versions with missing version",
                "^1.0.1",
                { devDependencies: {} },
                { devDependencies: { expectedDep: "^1.0.1" } },
                false,
            ],
            [
                "expects exact version with existing version ; shouldHaveExactVersions = true",
                "^1.0.1",
                { devDependencies: { expectedDep: "1.0.0" } },
                { devDependencies: { expectedDep: "1.0.1" } },
                true,
            ],
            [
                "expects exact version with existing version ; shouldHaveExactVersions = false",
                "^1.0.1",
                { devDependencies: { expectedDep: "1.0.0" } },
                { devDependencies: { expectedDep: "1.0.1" } },
                false,
            ],
            [
                "expects range version with existing version ; shouldHaveExactVersions = true",
                "^1.0.1",
                { devDependencies: { expectedDep: "^1.0.0" } },
                { devDependencies: { expectedDep: "^1.0.1" } },
                true,
            ],
            [
                "expects range version with existing version ; shouldHaveExactVersions = false ; with release",
                "^1.0.1-beta",
                { devDependencies: { expectedDep: "^1.0.0" } },
                { devDependencies: { expectedDep: "^1.0.1-beta" } },
                false,
            ],
        ];
        for (const [description, depValue, pkgContent, expectedFix, shouldHaveExactVersions,] of fixTestCases) {
            it(`should fix when ${description}`, () => {
                const depTypeInPkg = "devDependencies";
                const parsedPkg = parsePkgValue({ name: "test", ...pkgContent });
                checkSatisfiesVersionsFromDependency(parsedPkg, depTypeInPkg, ["expectedDep"], {
                    name: "test-dep",
                    [depTypeInPkg]: { expectedDep: depValue },
                }, depTypeInPkg, {
                    customCreateReportError: createReportError,
                    shouldHaveExactVersions: () => shouldHaveExactVersions,
                    tryToAutoFix: true,
                });
                assertDeepEqualIgnoringPrototypes(parsedPkg.value, {
                    name: "test",
                    ...expectedFix,
                });
            });
        }
    });
    describe("expect error when not dependency is not expected", () => {
        const testCases = [
            [
                "test1",
                "devDependencies",
                "missing in pkg",
                { devDependencies: { test1: "1.0.0" } },
                {},
                "Missing dependency",
                'should satisfies "1.0.0" from "test-dep" in "devDependencies"',
                "devDependencies",
                true,
            ],
            [
                "test2",
                "devDependencies",
                "dependency missing in pkg dependency",
                { devDependencies: { test2: "1.0.0" } },
                { devDependencies: {} },
                "Missing dependency",
                'should satisfies "1.0.0" from "test-dep" in "devDependencies"',
                "devDependencies",
                true,
            ],
            [
                "test3",
                "devDependencies",
                "devDependencies missing in pkg dependency",
                {},
                { devDependencies: { test3: "1.0.0" } },
                "Unexpected missing dependency",
                'config expects "test3" in "devDependencies" of "test-dep"',
            ],
            [
                "test4",
                "devDependencies",
                "invalid",
                { devDependencies: { test4: "0.1.0" } },
                { devDependencies: { test4: "1.0.0" } },
                "Invalid",
                '"1.0.0" should satisfies "0.1.0" from "test-dep" in "devDependencies"',
                "devDependencies",
                true,
            ],
        ];
        for (const [depName, depTypeInDep, description, depPkgContent, pkgContent, errorTitle, errorInfo, issueIn, autoFixable,] of testCases) {
            it(`should error when ${depName} is ${description} in ${depTypeInDep}`, () => {
                const depTypeInPkg = "devDependencies";
                const parsedPkg = parsePkgValue({ ...pkgContent, name: "test" });
                checkSatisfiesVersionsFromDependency(parsedPkg, depTypeInPkg, [depName], {
                    ...depPkgContent,
                    name: "test-dep",
                }, depTypeInDep, {
                    customCreateReportError: createReportError,
                    shouldHaveExactVersions: () => false,
                });
                assertCreateReportErrorCall(createReportError, "Satisfies Versions From Dependency");
                assertSingleMessage(messages, {
                    errorMessage: errorTitle,
                    errorDetails: errorInfo,
                    ...(issueIn
                        ? {
                            dependency: {
                                name: depName,
                                fieldName: issueIn,
                                ...(pkgContent[issueIn]?.[depName]
                                    ? {
                                        value: pkgContent[issueIn][depName],
                                    }
                                    : {}),
                            },
                        }
                        : {}),
                    onlyWarns: undefined,
                    autoFixable,
                });
            });
        }
    });
});
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.test.js.map