import type { ESLint } from "eslint";
import { PackageJSONLanguage } from "./eslint/language.ts";
import packageRules from "./eslint/rules.ts";

const checkPackagePlugin = {
  languages: {
    "package-json": PackageJSONLanguage,
  },
  rules: {
    ...packageRules,
  },
  configs: {
    base: {
      files: ["**/package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
    },
    recommended: {
      files: ["**/package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
      rules: {
        "check-package-dependencies/require-exact-versions": "error",
        "check-package-dependencies/resolutions-versions-match": "error",
        "check-package-dependencies/require-direct-peer-dependencies": "error",
        "check-package-dependencies/no-direct-duplicate-dependencies": "error",
        "check-package-dependencies/require-resolutions-explanation": "error",
        "check-package-dependencies/no-root-workspace-dependencies": "error",
        "check-package-dependencies/consistent-workspace-dependencies": "error",
        "check-package-dependencies/require-workspace-protocol": "error",
      },
    },
    "recommended-library": {
      files: ["**/package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
      settings: {
        "check-package-dependencies": {
          isLibrary: true,
        },
      },
      rules: {
        "check-package-dependencies/require-exact-versions": [
          "error",
          { dependencies: false },
        ],
        "check-package-dependencies/resolutions-versions-match": "error",
        "check-package-dependencies/require-direct-peer-dependencies": "error",
        "check-package-dependencies/no-direct-duplicate-dependencies": "error",
        "check-package-dependencies/require-resolutions-explanation": "error",
        "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies":
          "error",
        "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies":
          "error",
        "check-package-dependencies/no-root-workspace-dependencies": "error",
        "check-package-dependencies/consistent-workspace-dependencies": "error",
        "check-package-dependencies/require-workspace-protocol": "error",
      },
    },
  },
} satisfies ESLint.Plugin;

checkPackagePlugin.configs.base.plugins = {
  "check-package-dependencies": checkPackagePlugin,
};

checkPackagePlugin.configs.recommended.plugins = {
  "check-package-dependencies": checkPackagePlugin,
};

checkPackagePlugin.configs["recommended-library"].plugins = {
  "check-package-dependencies": checkPackagePlugin,
};

export default checkPackagePlugin;
