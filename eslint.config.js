import pobConfig from "@pob/eslint-config";
import checkPackagePlugin from "./dist/eslint-plugin-node.mjs";

export default [
  ...pobConfig(import.meta.url).configs.node,
  {
    ignores: ["vite.config.ts", "fixtures/**/package.json"],
  },
  checkPackagePlugin.configs["recommended-library"],
  {
    files: ["package.json"],
    settings: {
      "check-package-dependencies": {
        isLibrary: true,
      },
    },
    rules: {
      "check-package-dependencies/satisfies-versions": [
        "error",
        { devDependencies: { eslint: "*" } },
      ],
      "check-package-dependencies/satisfies-versions-between-dependencies": [
        "error",
        {
          dependencies: [
            {
              name: "@eslint/core",
              from: "eslint",
              to: "@eslint/plugin-kit",
            },
          ],
        },
      ],
      "check-package-dependencies/satisfies-versions-from-dependencies": [
        "error",
        {
          dependencies: { eslint: { dependencies: ["@eslint/plugin-kit"] } },
        },
      ],
    },
  },
];
