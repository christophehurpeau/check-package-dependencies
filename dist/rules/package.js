import { createCheckPackage } from "../check-package.js";
function createPackageRule(checkFn) {
    return {
        meta: {
            type: "problem",
            fixable: "code",
            schema: [], // We can add options schema later
        },
        create(context) {
            console.log(context.filename);
            return {
                Program(node) {
                    // Only run on package.json files
                    if (context.filename !== "package.json") {
                        return;
                    }
                    try {
                        const checkPackage = createCheckPackage();
                        checkFn(checkPackage);
                        checkPackage.runSync();
                        // Convert existing error reporting to ESLint reporting
                        context.report({
                            node,
                            message: "Package dependency check failed", // We'll make this more specific
                            fix(fixer) {
                                // Implement auto-fixing logic
                                return [];
                                // Start of Selection
                            },
                        });
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            context.report({
                                node,
                                message: `Failed to check package dependencies: ${error.message}`,
                            });
                        }
                        else {
                            context.report({
                                node,
                                message: "Failed to check package dependencies: Unknown error",
                            });
                        }
                    }
                },
            };
        },
    };
}
const rules = {
    "exact-versions": createPackageRule((api) => {
        api.checkExactVersions();
    }),
    // "resolutions-versions-match": createPackageRule((api) => {
    //   api.checkResolutionsVersionsMatch();
    // }),
    // "direct-peer-dependencies": createPackageRule((api) => {
    //   api.checkDirectPeerDependencies();
    // }),
    // "direct-duplicate-dependencies": createPackageRule((api) => {
    //   api.checkDirectDuplicateDependencies();
    // }),
    // "resolutions-has-explanation": createPackageRule((api) => {
    //   api.checkResolutionsHasExplanation();
    // }),
};
export default rules;
//# sourceMappingURL=package.js.map