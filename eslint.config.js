import pobConfig from "@pob/eslint-config";
import checkPackagePlugin from "./dist/eslint-plugin-node.mjs";

export default [
  ...pobConfig(import.meta.url).configs.node,
  {
    ignores: ["vite.config.ts"],
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
    },
  },
];
