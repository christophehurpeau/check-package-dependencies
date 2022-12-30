import type { GetDependencyPackageJson } from 'utils/createGetDependencyPackageJson';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForMappingCheck } from '../utils/warnForUtils';
export declare function checkDirectDuplicateDependencies(pkg: PackageJson, pkgPathName: string, depType: DependencyTypes, getDependencyPackageJson: GetDependencyPackageJson, onlyWarnsForCheck: OnlyWarnsForMappingCheck, reportErrorNamePrefix?: string, customCreateReportError?: typeof createReportError): Promise<void>;
//# sourceMappingURL=checkDirectDuplicateDependencies.d.ts.map