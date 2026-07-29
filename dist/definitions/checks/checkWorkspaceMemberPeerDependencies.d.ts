import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare const isPeerDependencyDeclaredInPackage: (pkg: ParsedPackageJson, peerDepName: string) => boolean;
export interface CheckWorkspaceMemberPeerDependenciesOptions {
    rootPkg: ParsedPackageJson;
    memberPkg: ParsedPackageJson;
    getDependencyPackageJson: GetDependencyPackageJson;
    onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck;
}
/**
 * Checks the peer dependencies of the dependencies of a workspace member against the
 * `devDependencies` of the workspace root, which is where a workspace member usually
 * gets them from.
 */
export declare function checkWorkspaceMemberPeerDependencies(reportError: ReportError, { rootPkg, memberPkg, getDependencyPackageJson, onlyWarnsForMappingCheck, }: CheckWorkspaceMemberPeerDependenciesOptions): void;
//# sourceMappingURL=checkWorkspaceMemberPeerDependencies.d.ts.map