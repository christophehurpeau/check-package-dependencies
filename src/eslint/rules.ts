import type { Rule } from "eslint";
import { checkExactVersion } from "../checks/checkExactVersions.ts";
import { checkResolutionVersionMatch } from "../checks/checkResolutionsVersionsMatch.ts";
import { getLocFromDependency } from "../reporting/ReportError.ts";
import type {
  ReportError,
  ReportErrorDetails,
} from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type {
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsFor, OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import type { DependencyValueAst, PackageJsonAst } from "./language.ts";

// interface CheckPackageDependenciesLanguageOptions {}

type CheckFn<RuleOptions, Node> = (params: {
  node: Node;
  pkg: ParsedPackageJson;
  reportError: ReportError;
  // languageOptions: CheckPackageDependenciesLanguageOptions;
  getDependencyPackageJson: GetDependencyPackageJson;
  ruleOptions: RuleOptions;
  onlyWarnsForCheck: OnlyWarnsForCheck;
}) => void;

function createPackageRule<RuleOptions extends { onlyWarnsFor?: OnlyWarnsFor }>(
  ruleName: string,
  schema: NonNullable<NonNullable<Rule.RuleModule["meta"]>["schema"]>,
  {
    checkPackage,
    checkDependencyValue,
  }: {
    checkPackage?: CheckFn<RuleOptions, ParsedPackageJson>;
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

        const onlyWarnsForCheck =
          schema && "onlyWarnsFor" in schema
            ? createOnlyWarnsForArrayCheck(ruleName, options.onlyWarnsFor)
            : createOnlyWarnsForArrayCheck(ruleName, []);

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

            context.report({
              message:
                details.errorMessage +
                (details.errorDetails ? `: ${details.errorDetails}` : ""),
              // TODO improve this by using start+end
              loc: location ?? { line: 1, column: 1 },

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
          };

        return {
          Package(node: any) {
            // Only run on package.json files
            if (!context.filename.endsWith("/package.json")) {
              context.report({
                message: "This rule is only applicable to package.json files",
                loc: { line: 1, column: 1 },
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
            } catch (error: unknown) {
              context.report({
                loc: { line: 1, column: 1 },
                message: `Failed to check package dependencies: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              });
            }
          },

          DependencyValue: checkDependencyValue
            ? (node: any) => {
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
                  ruleOptions: options,
                  onlyWarnsForCheck,
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
              }
            : undefined,
        };
      },
    } satisfies Rule.RuleModule,
  };
}

interface CheckExactVersionsOptions {
  dependencies?: boolean;
  devDependencies?: boolean;
  resolutions?: boolean;
  onlyWarnsFor?: OnlyWarnsFor;
}

const rules = {
  ...createPackageRule<CheckExactVersionsOptions>(
    "exact-versions",
    {
      type: "object",
      properties: {
        dependencies: { type: "boolean", default: true },
        devDependencies: { type: "boolean", default: true },
        resolutions: { type: "boolean", default: true },
        onlyWarnsFor: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({
        node,
        reportError,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForCheck,
      }) => {
        if (
          [
            ruleOptions.dependencies && "dependencies",
            ruleOptions.devDependencies && "devDependencies",
            ruleOptions.resolutions && "resolutions",
          ]
            .filter(Boolean)
            .includes(node.fieldName)
        ) {
          checkExactVersion(reportError, node, {
            getDependencyPackageJson,
            onlyWarnsForCheck,
          });
        }
      },
    },
  ),
  ...createPackageRule<CheckExactVersionsOptions>(
    "resolutions-versions-match",
    {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "resolutions") {
          checkResolutionVersionMatch(reportError, pkg, node);
        }
      },
    },
  ),
};

export default rules;
