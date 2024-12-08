import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parsePkg } from "./pkgJsonUtils.js";
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
        const parsedPkg = parsePkg(validPackageJson, "test-package.json");
        assert.equal(parsedPkg.name, "test-package");
        assert.deepEqual(parsedPkg.dependencies?.dep1, {
            fieldName: "dependencies",
            name: "dep1",
            value: "1.0.0",
            line: 5,
            column: 7,
            changeValue: parsedPkg.dependencies?.dep1?.changeValue,
        });
    });
    it("should throw an error for an invalid package.json file", () => {
        assert.throws(() => parsePkg(invalidPackageJson, "test-package.json"), /Failed to parse JSON/);
    });
});
//# sourceMappingURL=pkgJsonUtils.test.js.map