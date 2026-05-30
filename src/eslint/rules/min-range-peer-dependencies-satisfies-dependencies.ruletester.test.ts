import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { minRangePeerDependenciesSatisfiesDependenciesRule } from "./min-range-peer-dependencies-satisfies-dependencies.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

tester.run(
  "min-range-peer-dependencies-satisfies-dependencies",
  minRangePeerDependenciesSatisfiesDependenciesRule[
    "min-range-peer-dependencies-satisfies-dependencies"
  ]!,
  {
    valid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            peerDependencies: { foo: "^2.0.0" },
            dependencies: { foo: "^2.0.0" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
      },
      {
        code: `${JSON.stringify(
          {
            name: "test",
            peerDependencies: { foo: "*" },
            dependencies: { foo: "^2.0.0" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
      },
    ],
    invalid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            peerDependencies: { foo: "^1.0.0" },
            dependencies: { foo: "^2.0.0" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
        errors: [
          {
            message:
              /Invalid "\^1\.0\.0" in "peerDependencies".*should satisfies "\^2\.0\.0"/,
          },
        ],
        output: `${JSON.stringify(
          {
            name: "test",
            peerDependencies: { foo: "^2.0.0" },
            dependencies: { foo: "^2.0.0" },
          },
          null,
          2,
        )}\n`,
      },
    ],
  },
);
