export function createESLintReportError(context) {
    return (error) => {
        context.report({
            node: error.node,
            message: error.message,
            fix: error.fix,
        });
    };
}
//# sourceMappingURL=eslintReportError.js.map