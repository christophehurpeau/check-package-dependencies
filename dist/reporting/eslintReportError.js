export function createESLintReportError(context) {
    return (error) => {
        context.report({
            node: error.node,
            message: error.message,
            fix: error.fix,
        });
    };
}
export function eslintErrorReporting() {
    return {
        createESLintReportError,
    };
}
//# sourceMappingURL=eslintReportError.js.map