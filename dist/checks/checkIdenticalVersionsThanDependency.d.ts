import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';
export declare function checkIdenticalVersionsThanDependency(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, dependencies?: PackageJson[DependencyTypes], onlyWarnsForCheck?: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkIdenticalVersionsThanDependency.d.ts.map