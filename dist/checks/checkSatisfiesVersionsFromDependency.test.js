import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkSatisfiesVersionsFromDependency } from "./checkSatisfiesVersionsFromDependency.js";
describe(checkSatisfiesVersionsFromDependency.name, () => {
    const mockReportError = vi.fn();
    const createReportError = vi.fn().mockReturnValue(mockReportError);
    beforeEach(() => {
        mockReportError.mockReset();
    });
    it("should return no error when no keys", () => {
        checkSatisfiesVersionsFromDependency({ name: "test" }, "path", "dependencies", [], { name: "depTest", dependencies: {} }, "dependencies", {
            customCreateReportError: createReportError,
            shouldHaveExactVersions: () => false,
        });
        expect(mockReportError).not.toHaveBeenCalled();
    });
    describe("expect no error", () => {
        it.each([
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
        ])("should return no error when %s in %s is %s", (depName, depTypeInDep, _, depValueInDep, depValueInPkg) => {
            const depTypeInPkg = "devDependencies";
            const pkg = {
                name: "test",
                ...(depValueInPkg
                    ? { [depTypeInPkg]: { [depName]: depValueInPkg } }
                    : {}),
            };
            checkSatisfiesVersionsFromDependency(pkg, "path", depTypeInPkg, [depName], {
                name: "test-dep",
                [depTypeInDep]: { [depName]: depValueInDep },
            }, depTypeInDep, {
                customCreateReportError: createReportError,
                shouldHaveExactVersions: () => false,
            });
            expect(mockReportError).not.toHaveBeenCalled();
        });
    });
    describe("expect to fix", () => {
        it.each([
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
        ])("should to fix when %s", (_, depValueInDep, pkgContent, expectedPkgResult, shouldHaveExactVersions) => {
            const depTypeInPkg = "devDependencies";
            const depTypeInDep = "devDependencies";
            const depName = "expectedDep";
            const pkg = {
                name: "test",
                ...pkgContent,
            };
            checkSatisfiesVersionsFromDependency(pkg, "path", depTypeInPkg, [depName], {
                name: "test-dep",
                [depTypeInDep]: { [depName]: depValueInDep },
            }, depTypeInDep, {
                tryToAutoFix: true,
                customCreateReportError: createReportError,
                shouldHaveExactVersions: () => shouldHaveExactVersions,
            });
            expect(pkg).toEqual({
                name: "test",
                ...expectedPkgResult,
            });
        });
    });
    describe("expect error when dependency is expected", () => {
        it.each([
            [
                "test1",
                "devDependencies",
                "missing in pkg",
                { devDependencies: { test1: "1.0.0" } },
                {},
                'Missing "test1" in "devDependencies" of "test"',
                'should satisfies "1.0.0" from "test-dep" in "devDependencies".',
                true,
            ],
            [
                "test2",
                "devDependencies",
                "dependency missing in pkg dependency",
                { devDependencies: { test2: "1.0.0" } },
                { devDependencies: {} },
                'Missing "test2" in "devDependencies" of "test"',
                'should satisfies "1.0.0" from "test-dep" in "devDependencies".',
                true,
            ],
            [
                "test3",
                "devDependencies",
                "devDependencies missing in pkg dependency",
                {},
                { devDependencies: { test3: "1.0.0" } },
                'Unexpected missing dependency "test3" in "test-dep"',
                'config expects "test3" in "devDependencies" of "test-dep".',
                false,
            ],
            [
                "test4",
                "devDependencies",
                "invalid",
                { devDependencies: { test4: "0.1.0" } },
                { devDependencies: { test4: "1.0.0" } },
                'Invalid "test4" in "devDependencies" of "test"',
                '"1.0.0" should satisfies "0.1.0" from "test-dep"\'s "devDependencies".',
                true,
            ],
        ])("should error when %s is %s in %s", (depName, depTypeInDep, _, depPkgContent, pkgContent, errorTitle, errorInfo, autoFixable) => {
            const depTypeInPkg = "devDependencies";
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const pkg = {
                ...pkgContent,
                name: "test",
            };
            checkSatisfiesVersionsFromDependency(pkg, "path", depTypeInPkg, [depName], {
                ...depPkgContent,
                name: "test-dep",
            }, depTypeInDep, {
                customCreateReportError: createReportError,
                shouldHaveExactVersions: () => false,
            });
            expect(mockReportError).toHaveBeenCalledWith(errorTitle, errorInfo, undefined, autoFixable);
        });
    });
});
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.test.js.map