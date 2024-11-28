import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkResolutionsVersionsMatch } from "./checkResolutionsVersionsMatch.js";
describe("checkResolutionsVersionsMatch", () => {
    const mockReportError = vi.fn();
    const createReportError = vi.fn().mockReturnValue(mockReportError);
    beforeEach(() => {
        mockReportError.mockReset();
    });
    it('should return no error when no "resolutions" is present', () => {
        checkResolutionsVersionsMatch({ name: "test", devDependencies: { test: "1.0.0" } }, "path", { customCreateReportError: createReportError });
        expect(mockReportError).not.toHaveBeenCalled();
    });
    it('should return no error when "resolutions" has dependency not in other dependencies type', () => {
        checkResolutionsVersionsMatch({ name: "test", resolutions: { test: "1.0.0" } }, "path", { customCreateReportError: createReportError });
        expect(mockReportError).not.toHaveBeenCalled();
    });
    it('should return no error when "resolutions" has dependency matching', () => {
        checkResolutionsVersionsMatch({
            name: "test",
            resolutions: {
                test1: "1.0.0",
                test2: "1.0.0",
                test3: "1.0.1",
                "test4@npm:1.1.0": "patch:1.2.0",
            },
            devDependencies: { test1: "1.0.0", test4: "1.1.0" },
            dependencies: { test2: "1.0.0", test3: "^1.0.0" },
        }, "path", { customCreateReportError: createReportError });
        expect(mockReportError).not.toHaveBeenCalled();
    });
    it('should return error when "resolutions" has dependency not matching', () => {
        checkResolutionsVersionsMatch({
            name: "test",
            resolutions: {
                test1: "1.0.0",
                test2: "1.0.0",
                "test3@npm:1.1.0": "patch:1.2.0",
                "test4@npm:1.1.0": "patch:1.2.0",
            },
            devDependencies: { test1: "1.1.0" },
            dependencies: { test2: "1.2.0", test3: "1.0.0", test4: "1.2.0" },
        }, "path", { customCreateReportError: createReportError });
        expect(mockReportError).toHaveBeenCalledTimes(4);
        expect(mockReportError).toHaveBeenNthCalledWith(1, 'Invalid "test1" in devDependencies', 'expecting "1.1.0" be "1.0.0" from resolutions.', false, true);
        expect(mockReportError).toHaveBeenNthCalledWith(2, 'Invalid "test2" in dependencies', 'expecting "1.2.0" be "1.0.0" from resolutions.', false, true);
        expect(mockReportError).toHaveBeenNthCalledWith(3, 'Invalid "test3" in dependencies', 'expecting "1.0.0" be "1.1.0" from resolutions.', false, true);
        expect(mockReportError).toHaveBeenNthCalledWith(4, 'Invalid "test4" in dependencies', 'expecting "1.2.0" be "1.1.0" from resolutions.', false, true);
    });
    it('should fix without error when "resolutions" has dependency not matching', () => {
        const pkg = {
            name: "test",
            resolutions: { test1: "1.0.0", test2: "1.0.0" },
            devDependencies: { test1: "1.1.0" },
            dependencies: { test2: "1.2.0" },
        };
        checkResolutionsVersionsMatch(pkg, "path", {
            customCreateReportError: createReportError,
            tryToAutoFix: true,
        });
        expect(mockReportError).toHaveBeenCalledTimes(0);
        expect(pkg.devDependencies.test1).toBe("1.0.0");
        expect(pkg.dependencies.test2).toBe("1.0.0");
    });
});
//# sourceMappingURL=checkResolutionsVersionsMatch.test.js.map