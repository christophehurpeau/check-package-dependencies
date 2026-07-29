import { deepEqual, equal } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type { MockedFiles } from "../eslint.testUtils.ts";
import {
  fixPackageJson,
  lintPackageJsonMessages,
} from "../eslint.testUtils.ts";

const rules = { "consistent-workspace-dependencies": "error" } as const;

const filesWith = (rootRange: string, memberRange: string): MockedFiles => ({
  "package.json": {
    name: "fix-root",
    private: true,
    workspaces: ["packages/*"],
    devDependencies: { rollup: rootRange },
  },
  "packages/member/package.json": {
    name: "member",
    private: true,
    devDependencies: { rollup: memberRange },
  },
});

const memberPath = "packages/member/package.json";

describe("consistent-workspace-dependencies fixes", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should raise the range of the member to the one of the root", () => {
    const files = filesWith("4.1.10", "4.1.9");

    deepEqual(lintPackageJsonMessages(memberPath, files, { rules }), [
      'devDependencies > rollup: Invalid duplicate dependency: "4.1.9" should satisfies "4.1.10" from fix-root in devDependencies',
    ]);
    equal(
      fixPackageJson(memberPath, files, { rules }),
      `{
  "name": "member",
  "private": true,
  "devDependencies": {
    "rollup": "4.1.10"
  }
}
`,
    );
  });

  it("should raise the range of the root to the one of the member", () => {
    const files = filesWith("^6.0.0", "^7.0.0");

    deepEqual(lintPackageJsonMessages("package.json", files, { rules }), [
      'devDependencies > rollup: Invalid duplicate dependency: "^6.0.0" should satisfies "^7.0.0" from member in devDependencies',
    ]);
    equal(
      fixPackageJson("package.json", files, { rules }),
      `{
  "name": "fix-root",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "rollup": "^7.0.0"
  }
}
`,
    );
  });
});

describe("consistent-workspace-dependencies conflicts with no range to raise", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report a dist tag on the member, without fixing it", () => {
    const files = filesWith("^2.0.0", "next");

    deepEqual(lintPackageJsonMessages(memberPath, files, { rules }), [
      'devDependencies > rollup: Unsupported range for "rollup": "next" is not a valid semver range, "next" cannot be compared with "^2.0.0" from fix-root in devDependencies',
    ]);
    deepEqual(lintPackageJsonMessages("package.json", files, { rules }), []);
    equal(
      fixPackageJson(memberPath, files, { rules }),
      `{
  "name": "member",
  "private": true,
  "devDependencies": {
    "rollup": "next"
  }
}
`,
    );
  });

  it("should report a dist tag on the root, without fixing it", () => {
    const files = filesWith("next", "^2.0.0");

    deepEqual(lintPackageJsonMessages(memberPath, files, { rules }), [
      'devDependencies > rollup: Unsupported range for "rollup": "next" is not a valid semver range, "^2.0.0" cannot be compared with "next" from fix-root in devDependencies',
    ]);
    deepEqual(lintPackageJsonMessages("package.json", files, { rules }), []);
  });

  it("should report an alias installing another package, without fixing it", () => {
    const files = filesWith("npm:@rollup/rollup5@^5.0.0", "^5.0.0");

    deepEqual(lintPackageJsonMessages(memberPath, files, { rules }), [
      'devDependencies > rollup: Invalid duplicate dependency: "^5.0.0" and "npm:@rollup/rollup5@^5.0.0" from fix-root in devDependencies install different packages',
    ]);
    deepEqual(lintPackageJsonMessages("package.json", files, { rules }), []);
    equal(
      fixPackageJson(memberPath, files, { rules }),
      `{
  "name": "member",
  "private": true,
  "devDependencies": {
    "rollup": "^5.0.0"
  }
}
`,
    );
  });
});
