import pobConfig from "@pob/eslint-config";
import checkPackagePlugin from "./dist/eslint-plugin-node.mjs";

export default [
  ...pobConfig.configs.node,
  checkPackagePlugin.configs.recommended,
  {
    ignores: ["vite.config.ts", "fixtures/**/package.json"],
  },
  {
    files: ["package.json"],
    rules: {
      "check-package-dependencies/satisfies-versions": [
        "error",
        {
          devDependencies: {
            eslint: {
              range: "*",
              comment:
                "eslint has to be installed to develop against it, the supported range is the peer dependency",
            },
          },
        },
      ],
      "check-package-dependencies/satisfies-versions-between-dependencies": [
        "error",
        {
          dependencies: [
            {
              name: "@eslint/core",
              from: "eslint",
              to: "@eslint/plugin-kit",
              comment:
                "eslint and @eslint/plugin-kit have to agree on @eslint/core, whose types we use",
            },
          ],
        },
      ],
      "check-package-dependencies/satisfies-versions-from-dependencies": [
        "error",
        {
          comment:
            "we depend on @eslint/plugin-kit directly, it has to match the one eslint resolves",
          dependencies: { eslint: { dependencies: ["@eslint/plugin-kit"] } },
        },
      ],
    },
  },
];
