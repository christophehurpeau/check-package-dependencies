import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  changeOperator,
  getRealVersion,
  isDistTag,
  isSemverRange,
  minVersionOrNull,
  parseNpmAlias,
  specsIntersect,
} from "./semverUtils.ts";

describe("changeOperator", () => {
  it("should change the operator", () => {
    assert.equal(changeOperator("^1.0.1-beta", "~"), "~1.0.1-beta");
  });
});

describe("getRealVersion", () => {
  it("should get the real version", () => {
    assert.equal(getRealVersion("1.0.1-beta"), "1.0.1-beta");
  });
  it("should get the real version from a workspace version", () => {
    assert.equal(getRealVersion("workspace:1.0.1-beta"), "1.0.1-beta");
  });
  it("should get the real version from a workspace:~ shorthand", () => {
    assert.equal(getRealVersion("workspace:~"), "*");
  });
  it("should get the real version from a workspace:^ shorthand", () => {
    assert.equal(getRealVersion("workspace:^"), "*");
  });
  it("should get the real version from a npm version", () => {
    assert.equal(getRealVersion("npm:pkg@1.0.1-beta"), "1.0.1-beta");
  });

  it("should get the real version from a npm version with scope", () => {
    assert.equal(getRealVersion("npm:@scope/pkg@1.0.1-beta"), "1.0.1-beta");
  });

  it("should get the real version from a npm version without a range", () => {
    assert.equal(getRealVersion("npm:pkg"), "*");
    assert.equal(getRealVersion("npm:@scope/pkg"), "*");
  });
});

describe("parseNpmAlias", () => {
  it("should return null when the version is not an alias", () => {
    assert.equal(parseNpmAlias("1.0.0"), null);
    assert.equal(parseNpmAlias("workspace:^"), null);
  });

  it("should parse an alias", () => {
    assert.deepEqual(parseNpmAlias("npm:pkg@^1.0.0"), {
      aliasedName: "pkg",
      range: "^1.0.0",
    });
  });

  it("should parse a scoped alias", () => {
    assert.deepEqual(parseNpmAlias("npm:@typescript/typescript6@6.0.2"), {
      aliasedName: "@typescript/typescript6",
      range: "6.0.2",
    });
  });

  it("should parse an alias whose key is scoped but target is not", () => {
    assert.deepEqual(parseNpmAlias("npm:typescript@7.0.2"), {
      aliasedName: "typescript",
      range: "7.0.2",
    });
  });

  it("should parse an alias without a range", () => {
    assert.deepEqual(parseNpmAlias("npm:pkg"), {
      aliasedName: "pkg",
      range: "*",
    });
    assert.deepEqual(parseNpmAlias("npm:@scope/pkg"), {
      aliasedName: "@scope/pkg",
      range: "*",
    });
  });
});

describe("non-semver specifiers", () => {
  it("isSemverRange should only accept semver ranges", () => {
    assert.equal(isSemverRange("^1.0.0"), true);
    assert.equal(isSemverRange("*"), true);
    assert.equal(isSemverRange("link:../sdk"), false);
    assert.equal(isSemverRange("next"), false);
  });

  it("isDistTag should only accept bare tags", () => {
    assert.equal(isDistTag("next"), true);
    assert.equal(isDistTag("latest"), true);
    assert.equal(isDistTag("^1.0.0"), false);
    assert.equal(isDistTag("link:../sdk"), false);
    assert.equal(isDistTag("owner/repo"), false);
  });

  it("minVersionOrNull should not throw", () => {
    assert.equal(minVersionOrNull("^1.2.0")?.version, "1.2.0");
    assert.equal(minVersionOrNull("link:../sdk"), null);
  });

  it("specsIntersect should compare non-semver specifiers by equality", () => {
    assert.equal(specsIntersect("^1.0.0", "~1.2.0"), true);
    assert.equal(specsIntersect("^1.0.0", "^2.0.0"), false);
    assert.equal(specsIntersect("link:../sdk", "link:../sdk"), true);
    assert.equal(specsIntersect("link:../sdk", "link:../other"), false);
    assert.equal(specsIntersect("link:../sdk", "^1.0.0"), false);
  });

  it("specsIntersect should pass the range options to semver", () => {
    assert.equal(specsIntersect("1.0.0-beta.1", "<1.0.0"), false);
    assert.equal(
      specsIntersect("1.0.0-beta.1", "<1.0.0", { includePrerelease: true }),
      true,
    );
  });
});
