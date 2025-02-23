import { getLocFromDependency } from "../../reporting/ReportError.js";
import { getEntries } from "../../utils/object.js";
import { createOnlyWarnsForArrayCheck, createOnlyWarnsForMappingCheck, } from "../../utils/warnForUtils.js";
export const onlyWarnsForArraySchema = {
    type: "array",
    items: { type: "string" },
};
export const onlyWarnsForMappingSchema = {
    type: "object",
    patternProperties: {
        "^.*$": onlyWarnsForArraySchema,
    },
};
export function createPackageRule(ruleName, schema, { checkPackage, checkDependencyValue, }) {
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
                const settings = (context.settings["check-package-dependencies"] ??
                    {});
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
                    const dependencyInfo = details.dependency
                        ? `${details.dependency.fieldName ? `${details.dependency.fieldName} > ` : ""}${details.dependency.name}: `
                        : "";
                    const message = dependencyInfo +
                        details.errorMessage +
                        (details.errorDetails ? `: ${details.errorDetails}` : "");
                    if (isWarn) {
                        console.warn(`[warn] ${message} - ${ruleName}`);
                    }
                    else {
                        context.report({
                            message,
                            // TODO improve this by using start+end
                            loc: location ?? {
                                start: { line: 1, column: 1 },
                                end: { line: 1, column: 1 },
                            },
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
                const checkOnlyWarnsForArray = (onlyWarnsForCheck) => {
                    const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
                    if (notWarnedFor.length > 0) {
                        context.report({
                            message: `${onlyWarnsForMappingCheck.configName}: no warning was raised for ${notWarnedFor
                                .map((depName) => `"${depName}"`)
                                .join(", ")}. You should remove it or check if it is correct.`,
                            loc: {
                                start: { line: 1, column: 1 },
                                end: { line: 1, column: 1 },
                            },
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
                            loc: {
                                start: { line: 1, column: 1 },
                                end: { line: 1, column: 1 },
                            },
                        });
                    });
                };
                return {
                    Package(node) {
                        // Only run on package.json files
                        if (!context.filename.endsWith("/package.json")) {
                            context.report({
                                message: "This rule is only applicable to package.json files",
                                loc: {
                                    start: { line: 1, column: 1 },
                                    end: { line: 1, column: 1 },
                                },
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
                                    settings,
                                    ruleOptions: options,
                                    onlyWarnsForCheck,
                                    onlyWarnsForMappingCheck,
                                    checkOnlyWarnsForArray,
                                    checkOnlyWarnsForMapping,
                                    reportError: createReportError(),
                                });
                            }
                        }
                        catch (error) {
                            context.report({
                                loc: {
                                    start: { line: 1, column: 1 },
                                    end: { line: 1, column: 1 },
                                },
                                message: `Failed to check package dependencies: ${error instanceof Error ? error.message : String(error)}`,
                            });
                        }
                    },
                    "Package:exit"() {
                        try {
                            checkOnlyWarnsForArray(onlyWarnsForCheck);
                            checkOnlyWarnsForMapping(onlyWarnsForMappingCheck);
                        }
                        catch (error) {
                            context.report({
                                loc: {
                                    start: { line: 1, column: 1 },
                                    end: { line: 1, column: 1 },
                                },
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
                                    settings,
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
//# sourceMappingURL=createPackageRule.js.map