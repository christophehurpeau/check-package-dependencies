import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { requirePinnedVersionsRule } from "./require-pinned-versions.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
  settings: { "check-package-dependencies": { library: false } },
});

const packageJson = (pkg: Record<string, unknown>): string =>
  `${JSON.stringify({ name: "test", ...pkg }, null, 2)}\n`;

const asLibrary = { "check-package-dependencies": { library: true } };

tester.run(
  "require-pinned-versions",
  requirePinnedVersionsRule["require-pinned-versions"]!,
  {
    valid: [
      {
        code: packageJson({
          dependencies: { dep: "1.0.0" },
          devDependencies: { dep2: "1.0.0" },
          resolutions: { dep3: "1.0.0" },
        }),
        filename: "/tmp/package.json",
      },
      {
        // a library keeps ranges in "dependencies"
        code: packageJson({ dependencies: { dep: "^1.0.0" } }),
        filename: "/tmp/package.json",
        settings: asLibrary,
      },
      {
        code: packageJson({ peerDependencies: { dep: "^1.0.0" } }),
        filename: "/tmp/package.json",
      },
    ],
    invalid: [
      {
        code: packageJson({ devDependencies: { dep: "^1.0.0" } }),
        filename: "/tmp/package.json",
        errors: [{ message: /Unexpected range value/ }],
      },
      {
        code: packageJson({ dependencies: { dep: "^1.0.0" } }),
        filename: "/tmp/package.json",
        errors: [{ message: /Unexpected range value/ }],
      },
      {
        // a library still pins "devDependencies" and "resolutions"
        code: packageJson({
          devDependencies: { dep: "^1.0.0" },
          resolutions: { dep2: "^1.0.0" },
        }),
        filename: "/tmp/package.json",
        settings: asLibrary,
        errors: [
          { message: /Unexpected range value/ },
          { message: /Unexpected range value/ },
        ],
      },
    ],
  },
);
