import { deepEqual } from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import { Linter } from "eslint";
import eslintPlugin from "../../eslint-plugin.ts";

const rootDir = path.join(process.cwd(), "mocked-npm-alias-workspace");

const stringifyPkg = (pkg: object): string =>
  `${JSON.stringify(pkg, null, 2)}\n`;

/**
 * Lints a workspace root without touching the disk: the members are only read
 * through the `fs` calls of `loadWorkspacePackageJsons`, which resolves them
 * relative to the current working directory.
 */
const lintWorkspaceRoot = (
  rootPkg: object,
  members: Record<string, object>,
): string[] => {
  const memberDirs = Object.keys(members).map((dir) => path.join(rootDir, dir));
  const contentByPkgPath = new Map(
    Object.entries(members).map(([dir, pkg]) => [
      path.join(
        path.relative(process.cwd(), path.join(rootDir, dir)),
        "package.json",
      ),
      stringifyPkg(pkg),
    ]),
  );

  // linting a string never reads the disk, so any other path is a mistake
  const contentFor = (target: fs.PathLike): string => {
    const content = contentByPkgPath.get(String(target));
    if (content === undefined) {
      throw new Error(`Unexpected read of "${String(target)}"`);
    }
    return content;
  };

  mock.method(fs, "globSync", () => memberDirs);
  mock.method(fs, "accessSync", (target: fs.PathLike) => {
    contentFor(target);
  });
  mock.method(fs, "readFileSync", contentFor);

  const linter = new Linter();
  return linter
    .verify(
      stringifyPkg(rootPkg),
      [
        {
          files: ["**/package.json"],
          plugins: { "check-package-dependencies": eslintPlugin },
          language: "check-package-dependencies/package-json",
          rules: {
            "check-package-dependencies/consistent-workspace-dependencies":
              "error",
          },
        },
      ],
      path.join(rootDir, "package.json"),
    )
    .map((message) => message.message);
};

describe("consistent-workspace-dependencies with npm aliases", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  // semver cannot parse an alias as a range, so the raw value used to throw
  const root = {
    name: "mocked-root",
    private: true,
    workspaces: ["packages/*"],
    devDependencies: {
      "@typescript/native": "npm:typescript@7.0.2",
      typescript: "npm:@typescript/typescript6@6.0.2",
    },
  };

  it("should not report members aliasing the same packages with intersecting ranges", () => {
    deepEqual(
      lintWorkspaceRoot(root, {
        "packages/member": {
          name: "member",
          private: true,
          dependencies: {
            "@typescript/native": "npm:typescript@^7.0.0",
            typescript: "npm:@typescript/typescript6@^6.0.0",
          },
        },
      }),
      [],
    );
  });

  it("should report members aliasing the same package with non intersecting ranges", () => {
    deepEqual(
      lintWorkspaceRoot(root, {
        "packages/member": {
          name: "member",
          private: true,
          dependencies: { typescript: "npm:@typescript/typescript6@^7.0.0" },
        },
      }),
      [
        'member: Invalid duplicate dependency: "npm:@typescript/typescript6@^7.0.0" should satisfies "npm:@typescript/typescript6@6.0.2" from mocked-root in devDependencies',
      ],
    );
  });

  it("should report a member installing a different package under the same name", () => {
    deepEqual(
      lintWorkspaceRoot(root, {
        "packages/member": {
          name: "member",
          private: true,
          dependencies: {
            "@typescript/native": "7.0.2",
            typescript: "^5.0.0",
          },
        },
      }),
      [
        'member: Invalid duplicate dependency: "7.0.2" and "npm:typescript@7.0.2" from mocked-root in devDependencies install different packages',
        'member: Invalid duplicate dependency: "^5.0.0" and "npm:@typescript/typescript6@6.0.2" from mocked-root in devDependencies install different packages',
      ],
    );
  });

  it("should compare the members with each other", () => {
    deepEqual(
      lintWorkspaceRoot(root, {
        "packages/member-a": {
          name: "member-a",
          private: true,
          dependencies: { typescript: "npm:@typescript/typescript6@6.0.2" },
        },
        "packages/member-b": {
          name: "member-b",
          private: true,
          dependencies: { typescript: "npm:other-typescript@6.0.2" },
        },
      }),
      [
        'member-b: Invalid duplicate dependency: "npm:other-typescript@6.0.2" and "npm:@typescript/typescript6@6.0.2" from mocked-root in devDependencies install different packages',
        'member-b: Invalid duplicate dependency: "npm:other-typescript@6.0.2" and "npm:@typescript/typescript6@6.0.2" from member-a in dependencies install different packages',
      ],
    );
  });
});
