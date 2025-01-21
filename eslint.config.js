import pobTypescriptConfig from "@pob/eslint-config-typescript";
import checkPackagePlugin from "./dist/eslint-plugin.js";

export default [
  ...pobTypescriptConfig(import.meta.url).configs.node,
  {
    ignores: ["vite.config.ts"],
  },
  checkPackagePlugin.configs["recommended-library"],
];
