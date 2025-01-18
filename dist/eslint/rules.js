import { checkExactVersions } from "../checks/checkExactVersions.js";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.js";
function createPackageRule(ruleName, schema, checkFn) {
    return {
        [ruleName]: {
            meta: {
                type: "problem",
                fixable: "code",
                schema: schema ? [schema] : undefined,
            },
            create(context) {
                const languageOptions = context.languageOptions;
                const options = (context.options[0] ?? {});
                return {
                    Package(node) {
                        // Only run on package.json files
                        if (!context.filename.endsWith("/package.json")) {
                            context.report({
                                message: "This rule is only applicable to package.json files",
                                loc: { line: 1, column: 1 },
                            });
                        }
                        const { parsedPkgJson, getDependencyPackageJson } = node;
                        const onlyWarnsForCheck = schema && "onlyWarnsFor" in schema
                            ? createOnlyWarnsForArrayCheck(ruleName, options.onlyWarnsFor)
                            : createOnlyWarnsForArrayCheck(ruleName, []);
                        try {
                            // const checkPackage = createCheckPackage();
                            checkFn({
                                pkg: parsedPkgJson,
                                getDependencyPackageJson,
                                languageOptions,
                                ruleOptions: options,
                                onlyWarnsForCheck,
                                reportError: (message) => {
                                    context.report({
                                        message: message.errorMessage,
                                        loc: message.dependency?.line
                                            ? {
                                                line: message.dependency.line,
                                                column: message.dependency.column ?? 1,
                                            }
                                            : { line: 1, column: 1 },
                                        // suggest: message.autoFixable ?
                                        // fix(fixer) {
                                        //   // TODO
                                        //   return [];
                                        // },
                                    });
                                },
                            });
                            const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
                            if (notWarnedFor.length > 0) {
                                context.report({
                                    message: `Eslint rule ${ruleName} configured warn for: ${notWarnedFor.join(", ")} but was not used. You should remove it or check if it is correct.`,
                                    loc: { line: 1, column: 1 },
                                });
                            }
                        }
                        catch (error) {
                            context.report({
                                loc: { line: 1, column: 1 },
                                message: `Failed to check package dependencies: ${error instanceof Error ? error.message : String(error)}`,
                            });
                        }
                    },
                };
            },
        },
    };
}
const rules = {
    ...createPackageRule("exact-versions", {
        type: "object",
        properties: {
            allowRangeVersionsInDependencies: { type: "boolean", default: false },
            onlyWarnsFor: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
    }, ({ pkg, reportError, ruleOptions, getDependencyPackageJson, onlyWarnsForCheck, }) => {
        checkExactVersions(reportError, pkg, ruleOptions.allowRangeVersionsInDependencies
            ? ["dependencies", "devDependencies", "resolutions"]
            : ["devDependencies", "resolutions"], {
            getDependencyPackageJson,
            onlyWarnsForCheck,
        });
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
//# sourceMappingURL=rules.js.map