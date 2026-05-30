import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { resolutionsVersionsMatchRule } from "./resolutions-versions-match.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

tester.run(
  "resolutions-versions-match",
  resolutionsVersionsMatchRule["resolutions-versions-match"]!,
  {
    valid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            dependencies: { dep: "^1.0.0" },
            resolutions: { dep: "1.2.3" },
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
            dependencies: { other: "^1.0.0" },
            resolutions: { dep: "1.2.3" },
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
            dependencies: { dep: "^2.0.0" },
            resolutions: { dep: "1.2.3" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
        errors: [
          {
            message: /Invalid "\^2\.0\.0"/,
            suggestions: [
              {
                desc: 'Fix resolutions\'s value to "^2.0.0"',
                output: `${JSON.stringify(
                  {
                    name: "test",
                    dependencies: { dep: "^2.0.0" },
                    resolutions: { dep: "^2.0.0" },
                  },
                  null,
                  2,
                )}\n`,
              },
              {
                desc: 'Fix this value to resolutions\'s value "1.2.3"',
                output: `${JSON.stringify(
                  {
                    name: "test",
                    dependencies: { dep: "1.2.3" },
                    resolutions: { dep: "1.2.3" },
                  },
                  null,
                  2,
                )}\n`,
              },
            ],
          },
        ],
      },
    ],
  },
);
