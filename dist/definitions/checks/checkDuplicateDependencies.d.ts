import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface DuplicateConflictOwnership {
    /**
     * Conflicts whose two ranges cannot be ordered — an invalid range, npm aliases of
     * different packages, or equal minimum versions — have no range to raise, so they are
     * reported on the package this is true for. Exactly one of the two packages owns them.
     */
    ownsUnorderedConflicts: boolean;
}
export interface CheckDuplicateDependenciesParams {
    reportError: ReportError;
    pkg: ParsedPackageJson;
    isPkgLibrary: boolean;
    depType: DependencyTypes;
    searchIn: DependencyTypes[];
    depPkg: PackageJson;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    /**
     * Set when `depPkg` is another package checked by the same rule, typically another package
     * of the same workspace. A conflict is then reported only once, on the package whose range
     * has to be raised, which is also the only package a fix could be applied to.
     */
    conflictOwnership?: DuplicateConflictOwnership;
}
export declare function checkDuplicateDependencies({ reportError, pkg, isPkgLibrary, depType, searchIn, depPkg, onlyWarnsForCheck, conflictOwnership, }: CheckDuplicateDependenciesParams): void;
//# sourceMappingURL=checkDuplicateDependencies.d.ts.map