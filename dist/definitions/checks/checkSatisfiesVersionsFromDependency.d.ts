import { createReportError } from '../utils/createReportError';
import type { DependencyTypes, PackageJson } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';
export declare function checkSatisfiesVersionsFromDependency(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, dependencies?: PackageJson[DependencyTypes], onlyWarnsForCheck?: OnlyWarnsForCheck, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.d.ts.map