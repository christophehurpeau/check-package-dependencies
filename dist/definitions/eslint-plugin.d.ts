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
            };
        };
        "recommended-library": {
            files: string[];
            language: string;
            plugins: {};
            rules: {
                "check-package-dependencies/exact-versions": ["error", {
                    dependencies: boolean;
                }];
            };
        };
    };
};
export default checkPackagePlugin;
//# sourceMappingURL=eslint-plugin.d.ts.map