import { PackageJSONLanguage } from "./eslint/language.js";
import packageRules from "./eslint/rules.js";
const checkPackagePlugin = {
    languages: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        "package-json": PackageJSONLanguage,
    },
    rules: {
        ...packageRules,
    },
    configs: {
        recommended: {
            files: ["**/package.json"],
            language: "check-package-dependencies/package-json",
            plugins: {},
            rules: {
                "check-package-dependencies/exact-versions": "error",
                "check-package-dependencies/resolutions-versions-match": "error",
                "check-package-dependencies/direct-peer-dependencies": "error",
                "check-package-dependencies/direct-duplicate-dependencies": "error",
                "check-package-dependencies/resolutions-has-explanation": "error",
                "check-package-dependencies/root-workspace-should-not-have-dependencies": "error",
                "check-package-dependencies/workspace-dependencies": "error",
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
                "check-package-dependencies/exact-versions": [
                    "error",
                    { dependencies: false },
                ],
                "check-package-dependencies/resolutions-versions-match": "error",
                "check-package-dependencies/direct-peer-dependencies": "error",
                "check-package-dependencies/direct-duplicate-dependencies": "error",
                "check-package-dependencies/resolutions-has-explanation": "error",
                "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies": "error",
                "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies": "error",
                "check-package-dependencies/root-workspace-should-not-have-dependencies": "error",
                "check-package-dependencies/workspace-dependencies": "error",
            },
        },
    },
};
checkPackagePlugin.configs.recommended.plugins = {
    "check-package-dependencies": checkPackagePlugin,
};
checkPackagePlugin.configs["recommended-library"].plugins = {
    "check-package-dependencies": checkPackagePlugin,
};
export default checkPackagePlugin;
//# sourceMappingURL=eslint-plugin.js.map