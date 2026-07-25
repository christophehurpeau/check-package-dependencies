declare const checkPackagePlugin: {
    languages: {
        "package-json": import("@eslint/core").Language<{
            LangOptions: import("@eslint/core").LanguageOptions;
            Code: import("@eslint/core").SourceCode;
            RootNode: unknown;
            Node: unknown;
        }>;
    };
    rules: {
        [x: string]: import("eslint").Rule.RuleModule;
    };
    configs: {
        base: {
            files: string[];
            language: string;
            plugins: {};
        };
        recommended: {
            files: string[];
            language: string;
            plugins: {};
            rules: {
                "check-package-dependencies/require-pinned-versions": "error";
                "check-package-dependencies/resolutions-versions-match": "error";
                "check-package-dependencies/require-direct-peer-dependencies": "error";
                "check-package-dependencies/no-direct-duplicate-dependencies": "error";
                "check-package-dependencies/require-resolutions-explanation": "error";
                "check-package-dependencies/no-root-workspace-dependencies": "error";
                "check-package-dependencies/consistent-workspace-dependencies": "error";
                "check-package-dependencies/require-workspace-protocol": "error";
                "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies": "error";
                "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies": "error";
            };
        };
    };
};
export default checkPackagePlugin;
//# sourceMappingURL=eslint-plugin.d.ts.map