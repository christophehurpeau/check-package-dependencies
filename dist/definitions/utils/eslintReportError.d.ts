import type { Rule } from "eslint";
export interface ESLintReportError {
    ruleId: string;
    message: string;
    node: Rule.Node;
    fix?: (fixer: Rule.RuleFixer) => Rule.Fix[];
}
export declare function createESLintReportError(context: Rule.RuleContext): (error: ESLintReportError) => void;
//# sourceMappingURL=eslintReportError.d.ts.map