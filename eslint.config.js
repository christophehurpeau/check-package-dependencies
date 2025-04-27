import pobTypescriptConfig from "@pob/eslint-config-typescript";
import checkPackagePlugin from "./dist/eslint-plugin.js";

export default [
  ...pobTypescriptConfig(import.meta.url).configs.node,
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
