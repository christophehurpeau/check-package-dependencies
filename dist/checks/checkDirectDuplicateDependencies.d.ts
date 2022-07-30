import type { GetDependencyPackageJson } from 'utils/createGetDependencyPackageJson';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForMappingCheck } from '../utils/warnForUtils';
export declare function checkDirectDuplicateDependencies(pkg: PackageJson, pkgPathName: string, depType: DependencyTypes, getDependencyPackageJson: GetDependencyPackageJson, onlyWarnsForCheck: OnlyWarnsForMappingCheck, reportErrorNamePrefix?: string): void;
//# sourceMappingURL=checkDirectDuplicateDependencies.d.ts.map