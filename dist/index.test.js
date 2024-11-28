import { expect, it } from "vitest";
import { createCheckPackage, createCheckPackageWithWorkspaces, } from "./index.js";
it.each([
    ["createCheckPackage", createCheckPackage],
    ["createCheckPackageWithWorkspaces", createCheckPackageWithWorkspaces],
])("%s should be defined", (_, fn) => {
    expect(fn).toBeDefined();
});
//# sourceMappingURL=index.test.js.map