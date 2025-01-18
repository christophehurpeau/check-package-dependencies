import pobTypescriptConfig from "@pob/eslint-config-typescript";
import checkPackagePlugin from "./dist/eslint-plugin.js";

export default [
  ...pobTypescriptConfig(import.meta.url).configs.node,
  {
    ignores: ["vite.config.ts"],
  },
  {
    files: ["package.json"],
    language: "check-package-dependencies/package-json",
    languageOptions: { isLibrary: true },
    plugins: {
      "check-package-dependencies": checkPackagePlugin,
    },
    rules: {
      "check-package-dependencies/exact-versions": "error",
      // "check-package-dependencies/resolutions-versions-match": "error",
      // "check-package-dependencies/direct-peer-dependencies": "error",
      // "check-package-dependencies/direct-duplicate-dependencies": "error",
      // "check-package-dependencies/resolutions-has-explanation": "error",
    },
  },
];
