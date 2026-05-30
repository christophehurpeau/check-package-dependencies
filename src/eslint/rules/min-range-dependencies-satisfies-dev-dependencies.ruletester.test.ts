import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { minRangeDependenciesSatisfiesDevDependenciesRule } from "./min-range-dependencies-satisfies-dev-dependencies.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

tester.run(
  "min-range-dependencies-satisfies-dev-dependencies",
  minRangeDependenciesSatisfiesDevDependenciesRule[
    "min-range-dependencies-satisfies-dev-dependencies"
  ]!,
  {
    valid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            dependencies: { foo: "^2.0.0" },
            devDependencies: { foo: "^2.0.0" },
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
            dependencies: { foo: "^1.0.0" },
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
            dependencies: { foo: "^1.0.0" },
            devDependencies: { foo: "^2.0.0" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
        errors: [
          {
            message:
              /Invalid "\^1\.0\.0" in "dependencies".*should satisfies "\^2\.0\.0"/,
          },
        ],
        output: `${JSON.stringify(
          {
            name: "test",
            dependencies: { foo: "^2.0.0" },
            devDependencies: { foo: "^2.0.0" },
          },
          null,
          2,
        )}\n`,
      },
    ],
  },
);
