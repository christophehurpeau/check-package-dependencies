import { RuleTester } from "eslint";
import eslintPlugin from "../../eslint-plugin.ts";
import { requireIdenticalVersionsRule } from "./require-identical-versions.ts";

const tester = new RuleTester({
  plugins: eslintPlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
});

const packageJson = (devDependencies: Record<string, string>): string =>
  `${JSON.stringify({ name: "test", devDependencies }, null, 2)}\n`;

tester.run(
  "require-identical-versions",
  requireIdenticalVersionsRule["require-identical-versions"]!,
  {
    valid: [
      {
        code: packageJson({ react: "1.0.0", "react-dom": "1.0.0" }),
        filename: "/tmp/package.json",
        options: [{ devDependencies: { react: ["react-dom"] } }],
      },
    ],
    invalid: [
      {
        code: packageJson({ react: "1.0.0", "react-dom": "1.0.1" }),
        filename: "/tmp/package.json",
        options: [{ devDependencies: { react: ["react-dom"] } }],
        errors: [
          {
            message:
              'devDependencies > react-dom: Invalid "react-dom": expecting "1.0.1" to be "1.0.0" identical to "react" in "devDependencies"',
            line: 5,
            column: 5,
            endLine: 5,
            endColumn: 25,
          },
        ],
      },
    ],
  },
);
