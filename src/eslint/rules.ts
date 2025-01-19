import type { Rule } from "eslint";
import type { SetRequired } from "type-fest";
import { checkExactVersion } from "../checks/checkExactVersions.ts";
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

interface CheckPackageDependenciesLanguageOptions {
  isLibrary: boolean;
}

type CheckFn<RuleOptions, Node> = (params: {
  node: Node;
  pkg: ParsedPackageJson;
  reportError: ReportError;
  languageOptions: CheckPackageDependenciesLanguageOptions;
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
        schema: schema ? [schema] : undefined,
      },

      create(context) {
        const languageOptions =
          context.languageOptions as CheckPackageDependenciesLanguageOptions;
        const options = (context.options[0] ?? {}) as RuleOptions;

        const onlyWarnsForCheck =
          schema && "onlyWarnsFor" in schema
            ? createOnlyWarnsForArrayCheck(ruleName, options.onlyWarnsFor)
            : createOnlyWarnsForArrayCheck(ruleName, []);

        const createReportError =
          (
            fix?: (
              fixer: Rule.RuleFixer,
              details: SetRequired<ReportErrorDetails, "fixTo">,
            ) => ReturnType<Rule.ReportFixer>,
          ): ReportError =>
          (details) => {
            const location =
              details.dependency &&
              getLocFromDependency(details.dependency, details.errorTarget);
            context.report({
              message: details.errorMessage,
              // TODO improve this by using start+end
              loc: location ?? { line: 1, column: 1 },
              // suggest: message.autoFixable ?

              fix:
                fix && details.fixTo && location
                  ? (fixer) =>
                      fix(
                        fixer,
                        details as SetRequired<ReportErrorDetails, "fixTo">,
                      )
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
                  languageOptions,
                  ruleOptions: options,
                  onlyWarnsForCheck,
                  reportError: createReportError((fixer, details) => {
                    dependencyValue.changeValue(details.fixTo);
                    return fixer.replaceTextRange(
                      token.range,
                      dependencyValue.toString(),
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
  allowRangeVersionsInDependencies?: boolean;
  onlyWarnsFor?: OnlyWarnsFor;
}

const rules = {
  ...createPackageRule<CheckExactVersionsOptions>(
    "exact-versions",
    {
      type: "object",
      properties: {
        allowRangeVersionsInDependencies: { type: "boolean", default: false },
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
          (ruleOptions.allowRangeVersionsInDependencies
            ? ["dependencies", "devDependencies", "resolutions"]
            : ["devDependencies", "resolutions"]
          ).includes(node.fieldName)
        ) {
          checkExactVersion(reportError, node, {
            getDependencyPackageJson,
            onlyWarnsForCheck,
          });
        }
      },
    },
  ),

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
