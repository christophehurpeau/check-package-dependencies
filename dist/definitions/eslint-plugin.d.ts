declare const checkPackagePlugin: {
    languages: {
        "package-json": any;
    };
    rules: {
        [x: string]: import("eslint").Rule.RuleModule;
    };
    configs: {
        recommended: {
            files: string[];
            language: string;
            plugins: {};
            rules: {
                "check-package-dependencies/exact-versions": "error";
                "check-package-dependencies/resolutions-versions-match": "error";
                "check-package-dependencies/direct-peer-dependencies": "error";
                "check-package-dependencies/direct-duplicate-dependencies": "error";
                "check-package-dependencies/resolutions-has-explanation": "error";
                "check-package-dependencies/root-workspace-should-not-have-dependencies": "error";
            };
        };
        "recommended-library": {
            files: string[];
            language: string;
            plugins: {};
            settings: {
                "check-package-dependencies": {
                    isLibrary: boolean;
                };
            };
            rules: {
                "check-package-dependencies/exact-versions": ["error", {
                    dependencies: boolean;
                }];
                "check-package-dependencies/resolutions-versions-match": "error";
                "check-package-dependencies/direct-peer-dependencies": "error";
                "check-package-dependencies/direct-duplicate-dependencies": "error";
                "check-package-dependencies/resolutions-has-explanation": "error";
                "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies": "error";
                "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies": "error";
                "check-package-dependencies/root-workspace-should-not-have-dependencies": "error";
            };
        };
    };
};
export default checkPackagePlugin;
//# sourceMappingURL=eslint-plugin.d.ts.map