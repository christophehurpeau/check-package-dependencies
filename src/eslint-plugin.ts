import type { ESLint } from "eslint";
import { PackageJSONLanguage } from "./eslint/language.ts";
import packageRules from "./eslint/rules.ts";

const checkPackagePlugin = {
  languages: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    "package-json": PackageJSONLanguage as any,
  },
  rules: {
    ...packageRules,
  },
  configs: {
    recommended: {
      files: ["package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
      rules: {
        "check-package-dependencies/exact-versions": "error",
        // "check-package-dependencies/resolutions-versions-match": "error",
        // "check-package-dependencies/direct-peer-dependencies": "error",
        // "check-package-dependencies/direct-duplicate-dependencies": "error",
        // "check-package-dependencies/resolutions-has-explanation": "error",
      },
    },
    "recommended-library": {
      files: ["package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
      rules: {
        "check-package-dependencies/exact-versions": [
          "error",
          { dependencies: false },
        ],
      },
    },
  },
} satisfies ESLint.Plugin;

checkPackagePlugin.configs.recommended.plugins = {
  "check-package-dependencies": checkPackagePlugin,
};

checkPackagePlugin.configs["recommended-library"].plugins = {
  "check-package-dependencies": checkPackagePlugin,
};

export default checkPackagePlugin;
