import type { ReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';
export declare function checkPeerDependencies(pkg: PackageJson, reportError: ReportError, type: DependencyTypes, allowedPeerIn: DependencyTypes[], providedDependencies: [string, string][], depPkg: PackageJson, missingOnlyWarnsForCheck: OnlyWarnsForCheck, invalidOnlyWarnsForCheck: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkPeerDependencies.d.ts.map