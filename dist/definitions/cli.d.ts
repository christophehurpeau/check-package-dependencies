import type { ESLint as ESLintNamespace } from "eslint";
export interface CliOptions {
    directory: string;
    fix: boolean;
    quiet: boolean;
    format: string;
    help: boolean;
}
export declare function parseCliArgs(argv: string[]): CliOptions;
/**
 * The package.json files to lint: the one of `directory`, plus the one of every workspace
 * member when it declares workspaces, as most rules check the linted package.json itself.
 */
export declare function resolvePackageJsonPaths(directory: string): string[];
export declare function hasError(results: ESLintNamespace.LintResult[]): boolean;
export declare function main(argv: string[]): Promise<void>;
//# sourceMappingURL=cli.d.ts.map