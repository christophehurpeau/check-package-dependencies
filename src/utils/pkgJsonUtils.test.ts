import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type { ParsedPackageJson } from "./packageTypes.ts";
import { parsePkg } from "./pkgJsonUtils.ts";

describe("parsePkg", () => {
  const validPackageJson = `{
    "name": "test-package",
    "version": "1.0.0",
    "dependencies": {
      "dep1": "1.0.0"
    }
  }`;
  const invalidPackageJson = `{
    "name": "test-package",
    "version": "1.0.0",
    "dependencies": {
      "dep1": "1.0.0",
    }
  }`;

  it("should parse a valid package.json file", () => {
    const parsedPkg: ParsedPackageJson = parsePkg(
      validPackageJson,
      "test-package.json",
    );
    assert.equal(parsedPkg.name, "test-package");
    assert.deepEqual(parsedPkg.dependencies?.dep1, {
      fieldName: "dependencies",
      name: "dep1",
      value: "1.0.0",
      locations: {
        all: { start: { line: 5, column: 7 }, end: { line: 5, column: 22 } },
        name: { start: { line: 5, column: 7 }, end: { line: 5, column: 13 } },
        value: { start: { line: 5, column: 15 }, end: { line: 5, column: 22 } },
      },
      ranges: {
        all: [82, 97],
        name: [82, 88],
        value: [90, 97],
      },
      toString: parsedPkg.dependencies?.dep1.toString,
      changeValue: parsedPkg.dependencies?.dep1.changeValue,
    });
  });

  it("should throw an error for an invalid package.json file", () => {
    assert.throws(
      () => parsePkg(invalidPackageJson, "test-package.json"),
      /Failed to parse JSON/,
    );
  });
});
