import { checkDirectPeerDependencies, regularDependencyTypes, } from "../checks/checkDirectPeerDependencies.js";
import { checkExactVersion } from "../checks/checkExactVersions.js";
import { checkResolutionVersionMatch } from "../checks/checkResolutionsVersionsMatch.js";
import { checkMissingSatisfiesVersions, checkSatisfiesVersion, } from "../checks/checkSatisfiesVersions.js";
import { getLocFromDependency } from "../reporting/ReportError.js";
import { getEntries } from "../utils/object.js";
import { createOnlyWarnsForArrayCheck, createOnlyWarnsForMappingCheck, } from "../utils/warnForUtils.js";
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
                const schemaProperties = schema && "properties" in schema ? schema.properties : undefined;
                const onlyWarnsForCheck = schemaProperties &&
                    "onlyWarnsFor" in schemaProperties &&
                    schemaProperties.onlyWarnsFor.type === "array" &&
                    Array.isArray(options.onlyWarnsFor)
                    ? createOnlyWarnsForArrayCheck("onlyWarnsFor", options.onlyWarnsFor)
                    : createOnlyWarnsForArrayCheck("onlyWarnsFor", []);
                const onlyWarnsForMappingCheck = schemaProperties &&
                    "onlyWarnsFor" in schemaProperties &&
                    schemaProperties.onlyWarnsFor.type === "object" &&
                    typeof options.onlyWarnsFor === "object"
                    ? createOnlyWarnsForMappingCheck("onlyWarnsFor", options.onlyWarnsFor)
                    : createOnlyWarnsForMappingCheck("onlyWarnsFor", {});
                const createReportError = (fix) => (details) => {
                    const location = details.dependency &&
                        getLocFromDependency(details.dependency, details.errorTarget);
                    const fixTo = details.fixTo;
                    const suggestions = details.suggestions;
                    const isWarn = details.onlyWarns;
                    const message = details.errorMessage +
                        (details.errorDetails ? `: ${details.errorDetails}` : "");
                    if (isWarn) {
                        console.warn(`[warn] ${message} - ${ruleName}`);
                    }
                    else {
                        context.report({
                            message,
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
                    }
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
                        const checkOnlyWarnsForArray = (onlyWarnsForCheck) => {
                            const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
                            if (notWarnedFor.length > 0) {
                                context.report({
                                    message: `${onlyWarnsForMappingCheck.configName}: no warning was raised for ${notWarnedFor
                                        .map((depName) => `"${depName}"`)
                                        .join(", ")}. You should remove it or check if it is correct.`,
                                    loc: { line: 1, column: 1 },
                                });
                            }
                        };
                        const checkOnlyWarnsForMapping = (onlyWarnsForMappingCheck) => {
                            const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
                            getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
                                context.report({
                                    message: `${onlyWarnsForMappingCheck.configName}: no warning was raised for "${depNameOrStar}" > ${notWarnedFor
                                        .map((depName) => `"${depName}"`)
                                        .join(", ")}`,
                                    loc: { line: 1, column: 1 },
                                });
                            });
                        };
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
                                    onlyWarnsForMappingCheck,
                                    checkOnlyWarnsForArray,
                                    checkOnlyWarnsForMapping,
                                    reportError: createReportError(),
                                });
                            }
                            checkOnlyWarnsForArray(onlyWarnsForCheck);
                            checkOnlyWarnsForMapping(onlyWarnsForMappingCheck);
                        }
                        catch (error) {
                            context.report({
                                loc: { line: 1, column: 1 },
                                message: `Failed to check package dependencies: ${error instanceof Error ? error.message : String(error)}`,
                            });
                        }
                    },
                    ...(checkDependencyValue
                        ? {
                            DependencyValue(node) {
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
                                    onlyWarnsForMappingCheck,
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
                            },
                        }
                        : {}),
                };
            },
        },
    };
}
const onlyWarnsForArraySchema = {
    type: "array",
    items: { type: "string" },
};
const onlyWarnsForMappingSchema = {
    type: "object",
    patternProperties: {
        "^.*$": onlyWarnsForArraySchema,
    },
};
const rules = {
    ...createPackageRule("exact-versions", {
        type: "object",
        properties: {
            dependencies: { type: "boolean", default: true },
            devDependencies: { type: "boolean", default: true },
            resolutions: { type: "boolean", default: true },
            onlyWarnsFor: onlyWarnsForArraySchema,
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
    ...createPackageRule("direct-peer-dependencies", {
        type: "object",
        properties: {
            isLibrary: { type: "boolean" },
            onlyWarnsFor: onlyWarnsForMappingSchema,
            onlyWarnsForMissing: onlyWarnsForMappingSchema,
        },
        additionalProperties: false,
    }, {
        checkPackage: ({ pkg, reportError, ruleOptions, getDependencyPackageJson, onlyWarnsForMappingCheck: invalidOnlyWarnsForCheck, checkOnlyWarnsForMapping, }) => {
            const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck("onlyWarnsForMissing", ruleOptions.onlyWarnsForMissing);
            checkDirectPeerDependencies(reportError, ruleOptions.isLibrary ?? false, pkg, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck);
            checkOnlyWarnsForMapping(missingOnlyWarnsForCheck);
        },
    }),
};
export default rules;
//# sourceMappingURL=rules.js.map