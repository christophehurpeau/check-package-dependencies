import { checkExactVersion } from "../checks/checkExactVersions.js";
import { getLocFromDependency } from "../reporting/ReportError.js";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.js";
function createPackageRule(ruleName, schema, { checkPackage, checkDependencyValue, }) {
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
                const onlyWarnsForCheck = schema && "onlyWarnsFor" in schema
                    ? createOnlyWarnsForArrayCheck(ruleName, options.onlyWarnsFor)
                    : createOnlyWarnsForArrayCheck(ruleName, []);
                const createReportError = (fix) => (details) => {
                    const location = details.dependency &&
                        getLocFromDependency(details.dependency, details.errorTarget);
                    context.report({
                        message: details.errorMessage,
                        // TODO improve this by using start+end
                        loc: location ?? { line: 1, column: 1 },
                        // suggest: message.autoFixable ?
                        fix: fix && details.fixTo && location
                            ? (fixer) => fix(fixer, details)
                            : undefined,
                    });
                };
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
                        try {
                            // const checkPackage = createCheckPackage();
                            if (checkPackage) {
                                checkPackage({
                                    node: parsedPkgJson,
                                    pkg: parsedPkgJson,
                                    getDependencyPackageJson,
                                    languageOptions,
                                    ruleOptions: options,
                                    onlyWarnsForCheck,
                                    reportError: createReportError(),
                                });
                            }
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
                    DependencyValue: checkDependencyValue
                        ? (node) => {
                            const token = node;
                            const { dependencyValue, parsedPkgJson, getDependencyPackageJson, } = token;
                            if (!dependencyValue)
                                return;
                            checkDependencyValue({
                                node: dependencyValue,
                                pkg: parsedPkgJson,
                                getDependencyPackageJson,
                                languageOptions,
                                ruleOptions: options,
                                onlyWarnsForCheck,
                                reportError: createReportError((fixer, details) => {
                                    dependencyValue.changeValue(details.fixTo);
                                    return fixer.replaceTextRange(token.range, dependencyValue.toString());
                                }),
                            });
                        }
                        : undefined,
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
    }, {
        checkDependencyValue: ({ node, reportError, ruleOptions, getDependencyPackageJson, onlyWarnsForCheck, }) => {
            if ((ruleOptions.allowRangeVersionsInDependencies
                ? ["dependencies", "devDependencies", "resolutions"]
                : ["devDependencies", "resolutions"]).includes(node.fieldName)) {
                checkExactVersion(reportError, node, {
                    getDependencyPackageJson,
                    onlyWarnsForCheck,
                });
            }
        },
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