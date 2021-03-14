import type { ReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
export declare function checkWarnedFor(reportError: ReportError, onlyWarnsFor: string[] | undefined, warnedFor: Set<string>): void;
export declare function checkDirectDuplicateDependencies(pkg: PackageJson, pkgPathName: string, depType: DependencyTypes, searchIn: DependencyTypes[], depPkg: PackageJson, onlyWarnsFor?: string[], warnedForInternal?: Set<string>): void;
//# sourceMappingURL=checkDirectDuplicateDependencies.d.ts.map