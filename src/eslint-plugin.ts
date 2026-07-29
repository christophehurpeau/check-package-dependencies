import type { ESLint } from "eslint";
import {
  PackageJSONLanguage,
  packageJsonLanguageId,
  packageJsonLanguageName,
  pluginNamespace,
} from "./eslint/language.ts";
import packageRules from "./eslint/rules.ts";

const checkPackagePlugin = {
  meta: {
    name: "eslint-plugin-check-package-dependencies",
    namespace: pluginNamespace,
  },
  languages: {
    [packageJsonLanguageName]: PackageJSONLanguage,
  },
  rules: {
    ...packageRules,
  },
  configs: {
    base: {
      files: ["**/package.json"],
      language: packageJsonLanguageId,
      plugins: {},
    },
    recommended: {
      files: ["**/package.json"],
      language: packageJsonLanguageId,
      plugins: {},
      rules: {
        "check-package-dependencies/require-pinned-versions": "error",
        "check-package-dependencies/resolutions-versions-match": "error",
        "check-package-dependencies/require-direct-peer-dependencies": "error",
        "check-package-dependencies/no-direct-duplicate-dependencies": "error",
        "check-package-dependencies/require-resolutions-explanation": "error",
        "check-package-dependencies/no-root-workspace-dependencies": "error",
        "check-package-dependencies/consistent-workspace-dependencies": "error",
        "check-package-dependencies/require-workspace-protocol": "error",
        "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies":
          "error",
        "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies":
          "error",
      },
    },
  },
} satisfies ESLint.Plugin;

checkPackagePlugin.configs.base.plugins = {
  [pluginNamespace]: checkPackagePlugin,
};

checkPackagePlugin.configs.recommended.plugins = {
  [pluginNamespace]: checkPackagePlugin,
};

export default checkPackagePlugin;
