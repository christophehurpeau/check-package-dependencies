import type { Rule } from "eslint";
import type { Location } from "../../utils/packageTypes.ts";
import { documentationUrlBase } from "../create-rule/createPackageRule.ts";
import { getOnlyWarnsForWarnings } from "../create-rule/onlyWarnsForWarnings.ts";
import { packageJsonLanguageId } from "../language.ts";

const ruleName = "report-warns";

/** the location of a warning raised for something else than a dependency of the linted file */
const startOfFile: Location = {
  start: { line: 1, column: 1 },
  end: { line: 1, column: 1 },
};

export const reportWarnsRule = {
  [ruleName]: {
    meta: {
      type: "problem",
      languages: [packageJsonLanguageId],
      docs: {
        description:
          "Report the errors the other rules downgraded to warnings with their `onlyWarnsFor` option",
        recommended: true,
        url: `${documentationUrlBase}/${ruleName}.md`,
      },
      schema: [],
    },

    create(context) {
      return {
        // the traversal visits "Package" and every "DependencyValue" before this, so every
        // rule downgrading an error has already collected it, whatever order eslint ran them in
        "Package:exit"() {
          for (const warning of getOnlyWarnsForWarnings(
            context.sourceCode.ast,
          )) {
            context.report({
              message: `${warning.message} - ${warning.ruleName}`,
              loc: warning.loc ?? startOfFile,
            });
          }
        },
      };
    },
  },
} satisfies Record<string, Rule.RuleModule>;
