/* eslint-disable complexity */
import type { Rule } from "eslint";
import { getLocFromDependency } from "../../reporting/ReportError.ts";
import type {
  ReportError,
  ReportErrorDetails,
} from "../../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../../utils/createGetDependencyPackageJson.ts";
import { getEntries } from "../../utils/object.ts";
import type {
  DependencyValue,
  ParsedPackageJson,
} from "../../utils/packageTypes.ts";
import type {
  OnlyWarnsFor,
  OnlyWarnsForCheck,
  OnlyWarnsForMappingCheck,
} from "../../utils/warnForUtils.ts";
import {
  createOnlyWarnsForArrayCheck,
  createOnlyWarnsForMappingCheck,
} from "../../utils/warnForUtils.ts";
import type { DependencyValueAst, PackageJsonAst } from "../language.ts";

export const onlyWarnsForArraySchema = {
  type: "array",
  items: { type: "string" },
} as const;
export const onlyWarnsForMappingSchema = {
  type: "object",
  patternProperties: {
    "^.*$": onlyWarnsForArraySchema,
  },
} as const;

// interface CheckPackageDependenciesLanguageOptions {}

interface CheckPackageDependenciesSettings {
  isLibrary?: boolean;
}

type CheckFn<RuleOptions, Node, T = Record<never, never>> = (
  params: T & {
    node: Node;
    pkg: ParsedPackageJson;
    reportError: ReportError;
    // languageOptions: CheckPackageDependenciesLanguageOptions;
    getDependencyPackageJson: GetDependencyPackageJson;
    settings: CheckPackageDependenciesSettings;
    ruleOptions: RuleOptions;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck;
  },
) => void;

export function createPackageRule<
  RuleOptions extends { onlyWarnsFor?: OnlyWarnsFor },
>(
  ruleName: string,
  schema: NonNullable<NonNullable<Rule.RuleModule["meta"]>["schema"]>,
  {
    checkPackage,
    checkDependencyValue,
  }: {
    checkPackage?: CheckFn<
      RuleOptions,
      ParsedPackageJson,
      {
        checkOnlyWarnsForArray: (onlyWarnsForCheck: OnlyWarnsForCheck) => void;
        checkOnlyWarnsForMapping: (
          onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck,
        ) => void;
      }
    >;
    checkDependencyValue?: CheckFn<RuleOptions, DependencyValue>;
  },
): Record<string, Rule.RuleModule> {
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
        const options = (context.options[0] ?? {}) as RuleOptions;
        const settings = (context.settings["check-package-dependencies"] ??
          {}) as CheckPackageDependenciesSettings;

        const schemaProperties =
          schema && "properties" in schema ? schema.properties : undefined;

        const onlyWarnsForCheck =
          schemaProperties &&
          "onlyWarnsFor" in schemaProperties &&
          schemaProperties.onlyWarnsFor.type === "array" &&
          Array.isArray(options.onlyWarnsFor)
            ? createOnlyWarnsForArrayCheck("onlyWarnsFor", options.onlyWarnsFor)
            : createOnlyWarnsForArrayCheck("onlyWarnsFor", []);

        const onlyWarnsForMappingCheck =
          schemaProperties &&
          "onlyWarnsFor" in schemaProperties &&
          schemaProperties.onlyWarnsFor.type === "object" &&
          typeof options.onlyWarnsFor === "object"
            ? createOnlyWarnsForMappingCheck(
                "onlyWarnsFor",
                options.onlyWarnsFor,
              )
            : createOnlyWarnsForMappingCheck("onlyWarnsFor", {});

        const createReportError =
          (
            fix?: (
              fixer: Rule.RuleFixer,
              details: ReportErrorDetails,
              fixTo: string,
            ) => ReturnType<Rule.ReportFixer>,
          ): ReportError =>
          (details) => {
            const location =
              details.dependency &&
              getLocFromDependency(details.dependency, details.errorTarget);
            const fixTo = details.fixTo;
            const suggestions = details.suggestions;
            const isWarn = details.onlyWarns;
            const dependencyInfo = details.dependency
              ? `${details.dependency.fieldName ? `${details.dependency.fieldName} > ` : ""}${details.dependency.name}: `
              : "";
            const message =
              dependencyInfo +
              details.errorMessage +
              (details.errorDetails ? `: ${details.errorDetails}` : "");
            if (isWarn) {
              console.warn(`[warn] ${message} - ${ruleName}`);
            } else {
              context.report({
                message,

                // TODO improve this by using start+end
                loc: location ?? {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 },
                },

                fix:
                  fix && fixTo
                    ? (fixer) => fix(fixer, details, fixTo)
                    : undefined,

                suggest:
                  fix && suggestions
                    ? suggestions.map((suggestion) => ({
                        desc: suggestion[2] || `Replace with ${suggestion[1]}`,
                        fix: (fixer) =>
                          fix(
                            fixer,
                            { ...details, dependency: suggestion[0] },
                            suggestion[1],
                          ),
                      }))
                    : undefined,
              });
            }
          };

        const checkOnlyWarnsForArray = (
          onlyWarnsForCheck: OnlyWarnsForCheck,
        ): void => {
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

        const checkOnlyWarnsForMapping = (
          onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck,
        ): void => {
          const notWarnedForMapping =
            onlyWarnsForMappingCheck.getNotWarnedFor();
          getEntries(notWarnedForMapping).forEach(
            ([depNameOrStar, notWarnedFor]) => {
              context.report({
                message: `${onlyWarnsForMappingCheck.configName}: no warning was raised for "${depNameOrStar}" > ${notWarnedFor
                  .map((depName) => `"${depName}"`)
                  .join(", ")}`,
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 },
                },
              });
            },
          );
        };

        return {
          Package(node: any) {
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

            const { parsedPkgJson, getDependencyPackageJson } =
              node as PackageJsonAst;

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
            } catch (error: unknown) {
              context.report({
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 },
                },
                message: `Failed to check package dependencies: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              });
            }
          },

          "Package:exit"() {
            try {
              checkOnlyWarnsForArray(onlyWarnsForCheck);
              checkOnlyWarnsForMapping(onlyWarnsForMappingCheck);
            } catch (error: unknown) {
              context.report({
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 },
                },
                message: `Failed to check package dependencies: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              });
            }
          },

          ...(checkDependencyValue
            ? {
                DependencyValue(node: any) {
                  const token = node as DependencyValueAst;
                  const {
                    dependencyValue,
                    parsedPkgJson,
                    getDependencyPackageJson,
                  } = token;
                  if (!dependencyValue) return;
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
                      const targetDependencyValue: Partial<DependencyValue> =
                        details.dependency || dependencyValue;

                      if (details.errorTarget !== "dependencyValue") {
                        throw new Error(
                          `Invalid or unsupported errorTarget: ${String(details.errorTarget)}`,
                        );
                      }

                      targetDependencyValue.changeValue?.(fixTo);

                      if (!targetDependencyValue.ranges) {
                        return null;
                      }

                      const getTargetRangeFromErrorTarget = (
                        errorTarget: ReportErrorDetails["errorTarget"],
                      ): [number, number] | undefined => {
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

                      const targetRange = getTargetRangeFromErrorTarget(
                        details.errorTarget,
                      );

                      if (!targetRange) {
                        return null;
                      }

                      return fixer.replaceTextRange(
                        targetRange,
                        !details.errorTarget
                          ? dependencyValue.toString()
                          : JSON.stringify(fixTo),
                      );
                    }),
                  });
                },
              }
            : {}),
        };
      },
    } satisfies Rule.RuleModule,
  };
}
