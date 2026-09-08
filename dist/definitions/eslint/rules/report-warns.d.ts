import type { Rule } from "eslint";
export declare const reportWarnsRule: {
    "report-warns": {
        meta: {
            type: "problem";
            languages: string[];
            docs: {
                description: string;
                recommended: boolean;
                url: string;
            };
            schema: never[];
        };
        create(context: Rule.RuleContext): {
            "Package:exit"(): void;
        };
    };
};
//# sourceMappingURL=report-warns.d.ts.map