import type { ReportError } from "../reporting/ReportError.ts";
import type { Commented } from "../utils/comments.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
/**
 * The dependencies to keep identical to the reference dependency: the names to look up in
 * the same field as the reference dependency, or the names to look up per field. Only the
 * latter can carry the comment explaining what the entry is for.
 */
export type IdenticalVersionsDepConfig = string[] | (Commented & Partial<Record<DependencyTypes, string[]>>);
export declare function checkIdenticalVersions(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, deps: Record<string, IdenticalVersionsDepConfig>, { onlyWarnsForCheck }?: {
    onlyWarnsForCheck?: OnlyWarnsForCheck;
}): void;
//# sourceMappingURL=checkIdenticalVersions.d.ts.map