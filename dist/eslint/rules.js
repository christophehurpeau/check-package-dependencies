import { regularDependencyTypes } from "../checks/checkDirectPeerDependencies.js";
import { checkExactVersion } from "../checks/checkExactVersions.js";
import { checkResolutionVersionMatch } from "../checks/checkResolutionsVersionsMatch.js";
import { checkMissingSatisfiesVersions, checkSatisfiesVersion, } from "../checks/checkSatisfiesVersions.js";
import { getLocFromDependency } from "../reporting/ReportError.js";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.js";
function createPackageRule(ruleName, schema, { checkPackage, checkDependencyValue, }) {
    return {
        [ruleName]: {
            meta: {
                type: "problem",
                fixable: "code",
                hasSuggestions: true,
                schema: schema ? [schema] : undefined,
            },
            create(context) {
                // const languageOptions =
                //   context.languageOptions as CheckPackageDependenciesLanguageOptions;
                const options = (context.options[0] ?? {});
                const onlyWarnsForCheck = schema && "onlyWarnsFor" in schema
                    ? createOnlyWarnsForArrayCheck(ruleName, options.onlyWarnsFor)
                    : createOnlyWarnsForArrayCheck(ruleName, []);
                const createReportError = (fix) => (details) => {
                    const location = details.dependency &&
                        getLocFromDependency(details.dependency, details.errorTarget);
                    const fixTo = details.fixTo;
                    const suggestions = details.suggestions;
                    context.report({
                        message: details.errorMessage +
                            (details.errorDetails ? `: ${details.errorDetails}` : ""),
                        // TODO improve this by using start+end
                        loc: location ?? { line: 1, column: 1 },
                        fix: fix && fixTo
                            ? (fixer) => fix(fixer, details, fixTo)
                            : undefined,
                        suggest: fix && suggestions
                            ? suggestions.map((suggestion) => ({
                                desc: suggestion[2] || `Replace with ${suggestion[1]}`,
                                fix: (fixer) => fix(fixer, { ...details, dependency: suggestion[0] }, suggestion[1]),
                            }))
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
                                    // languageOptions,
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
                                // languageOptions,
                                ruleOptions: options,
                                onlyWarnsForCheck,
                                reportError: createReportError((fixer, details, fixTo) => {
                                    const targetDependencyValue = details.dependency || dependencyValue;
                                    if (details.errorTarget !== "dependencyValue") {
                                        throw new Error(`Invalid or unsupported errorTarget: ${String(details.errorTarget)}`);
                                    }
                                    targetDependencyValue.changeValue?.(fixTo);
                                    if (!targetDependencyValue.ranges) {
                                        return null;
                                    }
                                    const getTargetRangeFromErrorTarget = (errorTarget) => {
                                        switch (errorTarget) {
                                            case "dependencyValue":
                                                return targetDependencyValue.ranges?.value;
                                            case "dependencyName":
                                                return targetDependencyValue.ranges?.name;
                                            case undefined:
                                            default:
                                                return targetDependencyValue.ranges?.all;
                                        }
                                    };
                                    const targetRange = getTargetRangeFromErrorTarget(details.errorTarget);
                                    if (!targetRange) {
                                        return null;
                                    }
                                    return fixer.replaceTextRange(targetRange, !details.errorTarget
                                        ? dependencyValue.toString()
                                        : JSON.stringify(fixTo));
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
            dependencies: { type: "boolean", default: true },
            devDependencies: { type: "boolean", default: true },
            resolutions: { type: "boolean", default: true },
            onlyWarnsFor: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
    }, {
        checkDependencyValue: ({ node, reportError, ruleOptions, getDependencyPackageJson, onlyWarnsForCheck, }) => {
            if ([
                ruleOptions.dependencies && "dependencies",
                ruleOptions.devDependencies && "devDependencies",
                ruleOptions.resolutions && "resolutions",
            ]
                .filter(Boolean)
                .includes(node.fieldName)) {
                checkExactVersion(reportError, node, {
                    getDependencyPackageJson,
                    onlyWarnsForCheck,
                });
            }
        },
    }),
    ...createPackageRule("resolutions-versions-match", {
        type: "object",
        properties: {},
        additionalProperties: false,
    }, {
        checkDependencyValue: ({ node, pkg, reportError }) => {
            if (node.fieldName === "resolutions") {
                checkResolutionVersionMatch(reportError, pkg, node);
            }
        },
    }),
    ...createPackageRule("satisfies-versions", {
        type: "object",
        properties: {
            dependencies: {
                type: "object",
                additionalProperties: { type: "string" },
            },
            devDependencies: {
                type: "object",
                additionalProperties: { type: "string" },
            },
            optionalDependencies: {
                type: "object",
                additionalProperties: { type: "string" },
            },
            onlyWarnsFor: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
    }, {
        checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
            if (!ruleOptions.dependencies && !ruleOptions.devDependencies) {
                throw new Error('Rule "check-package-dependencies/satisfies-versions" is enabled but no dependencies are configured to check');
            }
            regularDependencyTypes.forEach((type) => {
                if (ruleOptions[type]) {
                    checkMissingSatisfiesVersions(reportError, pkg, type, ruleOptions[type], onlyWarnsForCheck);
                }
            });
        },
        checkDependencyValue: ({ node, reportError, ruleOptions, onlyWarnsForCheck, }) => {
            if (!regularDependencyTypes.includes(node.fieldName)) {
                return;
            }
            const fieldName = node.fieldName;
            if (ruleOptions[fieldName]?.[node.name]) {
                const range = ruleOptions[fieldName][node.name];
                checkSatisfiesVersion(reportError, node, range, onlyWarnsForCheck);
            }
        },
    }),
};
export default rules;
//# sourceMappingURL=rules.js.map