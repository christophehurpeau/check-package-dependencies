import { Linter } from "eslint";
/** a file of the mocked filesystem, an object being stringified as a package.json would be */
export type MockedFileContent = object | string;
/**
 * The files a test declares, keyed by a path relative to the current working directory.
 *
 * The rules resolve the workspace root and its members from the current working directory,
 * so the mocked filesystem is mounted on it rather than on a directory of its own.
 */
export type MockedFiles = Record<string, MockedFileContent>;
/**
 * Replaces every `fs` read the rules do with `files`. A path `files` does not declare is one
 * the test did not intend to read: it throws, so an unexpected disk read fails loudly instead
 * of silently making the test pass.
 *
 * Call `mock.restoreAll()` in an `afterEach`.
 */
export declare function mockFileSystem(files: MockedFiles): void;
export interface LintPackageJsonOptions {
    /** rule name, without the plugin prefix, to its configuration */
    rules: Record<string, Linter.RuleEntry>;
    /** the "check-package-dependencies" settings */
    settings?: Record<string, unknown>;
}
/**
 * Lints one of the mocked `package.json` files. Nothing is read from the disk: the linted
 * content comes from `files`, and so does everything the rules read about the other packages.
 */
export declare function lintPackageJson(filePath: string, files: MockedFiles, options: LintPackageJsonOptions): Linter.LintMessage[];
/** Same as {@link lintPackageJson}, returning only the messages. */
export declare function lintPackageJsonMessages(filePath: string, files: MockedFiles, options: LintPackageJsonOptions): string[];
/** Same as {@link lintPackageJson}, returning the content `eslint --fix` would write. */
export declare function fixPackageJson(filePath: string, files: MockedFiles, options: LintPackageJsonOptions): string;
//# sourceMappingURL=eslint.testUtils.d.ts.map