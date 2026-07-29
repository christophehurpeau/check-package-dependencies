import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectIsLibrary, resolveIsLibrary } from "./library.ts";
import { parsePkgValue } from "./pkgJsonUtils.ts";

describe("detectIsLibrary", () => {
  it("should detect a published package as a library", () => {
    assert.equal(
      detectIsLibrary(parsePkgValue({ name: "pkg", version: "1.0.0" })),
      true,
    );
  });
  it("should not detect a private package as a library", () => {
    assert.equal(
      detectIsLibrary(parsePkgValue({ name: "pkg", private: true })),
      false,
    );
  });
  it("should not detect a workspace root as a library", () => {
    assert.equal(
      detectIsLibrary(
        parsePkgValue({ name: "root", workspaces: ["packages/*"] }),
      ),
      false,
    );
  });
});

describe("resolveIsLibrary", () => {
  const publishedPkg = parsePkgValue({ name: "pkg", version: "1.0.0" });
  const privatePkg = parsePkgValue({ name: "pkg", private: true });
  const scopedPkg = parsePkgValue({ name: "@scope/pkg", version: "1.0.0" });

  it("should default to detecting it", () => {
    assert.equal(resolveIsLibrary(undefined, publishedPkg), true);
    assert.equal(resolveIsLibrary(undefined, privatePkg), false);
  });
  it("should keep an explicit boolean", () => {
    assert.equal(resolveIsLibrary(false, publishedPkg), false);
    assert.equal(resolveIsLibrary(true, privatePkg), true);
  });
  it('should detect it with "auto"', () => {
    assert.equal(resolveIsLibrary("auto", publishedPkg), true);
    assert.equal(resolveIsLibrary("auto", privatePkg), false);
  });

  describe("with a list of package name patterns", () => {
    it("should match an exact name", () => {
      assert.equal(resolveIsLibrary(["pkg"], publishedPkg), true);
      assert.equal(resolveIsLibrary(["other"], publishedPkg), false);
    });
    it("should not match a name partially", () => {
      assert.equal(resolveIsLibrary(["pkg"], scopedPkg), false);
      assert.equal(resolveIsLibrary(["@scope/pk"], scopedPkg), false);
    });
    it("should match a wildcard", () => {
      assert.equal(resolveIsLibrary(["@scope/*"], scopedPkg), true);
      assert.equal(resolveIsLibrary(["@scope/*"], publishedPkg), false);
      assert.equal(resolveIsLibrary(["*"], publishedPkg), true);
    });
    it("should ignore the detection", () => {
      assert.equal(resolveIsLibrary(["pkg"], privatePkg), true);
      assert.equal(resolveIsLibrary([], publishedPkg), false);
    });
    it("should let the last matching pattern win", () => {
      assert.equal(
        resolveIsLibrary(["@scope/*", "!@scope/pkg"], scopedPkg),
        false,
      );
      assert.equal(
        resolveIsLibrary(["!@scope/pkg", "@scope/*"], scopedPkg),
        true,
      );
      assert.equal(resolveIsLibrary(["*", "!@scope/*"], publishedPkg), true);
      assert.equal(resolveIsLibrary(["*", "!@scope/*"], scopedPkg), false);
    });
    it("should not match anything with only exclusions", () => {
      assert.equal(resolveIsLibrary(["!other"], publishedPkg), false);
    });
  });
});
