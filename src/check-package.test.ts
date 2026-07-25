import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCheckPackageWithWorkspaces } from "./check-package-with-workspaces.ts";
import { createCheckPackage } from "./check-package.ts";

describe("createCheckPackage", () => {
  it("should throw when the legacy isLibrary option is used", () => {
    assert.throws(
      // @ts-expect-error the option was renamed to "library"
      () => createCheckPackage({ isLibrary: true }),
      /The "isLibrary" option was renamed to "library"/,
    );
  });
});

describe("createCheckPackageWithWorkspaces", () => {
  it("should throw when the legacy isLibrary option is used", () => {
    assert.throws(
      // @ts-expect-error the option was renamed to "library"
      () => createCheckPackageWithWorkspaces({ isLibrary: () => true }),
      /The "isLibrary" option was renamed to "library"/,
    );
  });
});
