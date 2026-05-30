import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { satisfiesVersionsRule } from "./satisfies-version.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

tester.run("satisfies-versions", satisfiesVersionsRule["satisfies-versions"]!, {
  valid: [
    {
      code: `${JSON.stringify(
        { name: "test", dependencies: { foo: "^1.0.0" } },
        null,
        2,
      )}\n`,
      filename: "/tmp/package.json",
      options: [{ dependencies: { foo: "^1.0.0" } }],
    },
  ],
  invalid: [
    {
      code: `${JSON.stringify(
        { name: "test", devDependencies: { other: "^1.0.0" } },
        null,
        2,
      )}\n`,
      filename: "/tmp/package.json",
      options: [{ dependencies: { foo: "^1.0.0" } }],
      errors: [
        {
          message: /Missing "foo" in "dependencies"/,
        },
      ],
    },
  ],
});
