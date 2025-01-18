import type { Rule } from "eslint";
import { checkExactVersions } from "../checks/checkExactVersions.ts";
import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsFor, OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import type { PackageJsonAst } from "./language.ts";

interface CheckPackageDependenciesLanguageOptions {
  isLibrary: boolean;
}

function createPackageRule<RuleOptions extends { onlyWarnsFor?: OnlyWarnsFor }>(
  ruleName: string,
  schema: NonNullable<NonNullable<Rule.RuleModule["meta"]>["schema"]>,
  checkFn: (params: {
    pkg: ParsedPackageJson;
    reportError: ReportError;
    languageOptions: CheckPackageDependenciesLanguageOptions;
    getDependencyPackageJson: GetDependencyPackageJson;
    ruleOptions: RuleOptions;
    onlyWarnsForCheck: OnlyWarnsForCheck;
  }) => void,
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

            const onlyWarnsForCheck =
              schema && "onlyWarnsFor" in schema
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
                    // TODO improve this by using start+end
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
            } catch (error: unknown) {
              context.report({
                loc: { line: 1, column: 1 },
                message: `Failed to check package dependencies: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              });
            }
          },
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
    ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck,
    }) => {
      checkExactVersions(
        reportError,
        pkg,
        ruleOptions.allowRangeVersionsInDependencies
          ? ["dependencies", "devDependencies", "resolutions"]
          : ["devDependencies", "resolutions"],
        {
          getDependencyPackageJson,
          onlyWarnsForCheck,
        },
      );
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
