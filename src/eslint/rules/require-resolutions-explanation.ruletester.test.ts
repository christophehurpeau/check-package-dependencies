import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { requireResolutionsExplanationRule } from "./require-resolutions-explanation.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

tester.run(
  "require-resolutions-explanation",
  requireResolutionsExplanationRule["require-resolutions-explanation"]!,
  {
    valid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            resolutions: { dep: "1.2.3" },
            resolutionsExplained: { dep: "because reason" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
      },
      {
        code: `${JSON.stringify({ name: "test" }, null, 2)}\n`,
        filename: "/tmp/package.json",
      },
    ],
    invalid: [
      {
        code: `${JSON.stringify(
          {
            name: "test",
            resolutions: { dep: "1.2.3" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
        errors: [{ message: /Missing "dep" in "resolutionsExplained"/ }],
      },
      {
        code: `${JSON.stringify(
          {
            name: "test",
            resolutionsExplained: { dep: "because reason" },
          },
          null,
          2,
        )}\n`,
        filename: "/tmp/package.json",
        errors: [
          {
            message:
              /Found "dep" in "resolutionsExplained" but not in "resolutions"/,
          },
        ],
      },
    ],
  },
);
