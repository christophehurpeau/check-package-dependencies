import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  changeOperator,
  getRealVersion,
  parseNpmAlias,
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
