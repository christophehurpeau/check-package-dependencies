import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { rootWorkspaceShouldNotHaveDependenciesRule } from "./root-workspace-should-not-have-dependencies.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

tester.run(
  "root-workspace-should-not-have-dependencies",
  rootWorkspaceShouldNotHaveDependenciesRule[
    "root-workspace-should-not-have-dependencies"
  ]!,
  {
    valid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            workspaces: ["packages/*"],
            devDependencies: { foo: "^1.0.0" },
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
            workspaces: ["packages/*"],
            dependencies: { foo: "^1.0.0" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
        errors: [{ message: /Root workspace should not have dependencies/ }],
      },
    ],
  },
);
