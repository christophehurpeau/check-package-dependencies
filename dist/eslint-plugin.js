import { PackageJSONLanguage } from "./eslint/language.js";
import packageRules from "./eslint/rules.js";
const eslintPlugin = {
    languages: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        "package-json": PackageJSONLanguage,
    },
    rules: {
        ...packageRules,
    },
    configs: {
        recommended: {
            files: ["package.json"],
            language: "check-package-dependencies/package-json",
            plugins: ["check-package-dependencies"],
            rules: {
                "check-package-dependencies/exact-versions": "error",
                // "check-package-dependencies/resolutions-versions-match": "error",
                // "check-package-dependencies/direct-peer-dependencies": "error",
                // "check-package-dependencies/direct-duplicate-dependencies": "error",
                // "check-package-dependencies/resolutions-has-explanation": "error",
            },
        },
    },
};
export default eslintPlugin;
//# sourceMappingURL=eslint-plugin.js.map