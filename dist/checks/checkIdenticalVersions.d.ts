import type { DependencyTypes, PackageJson } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';
export declare function checkIdenticalVersions(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, deps: Record<string, string[] | Partial<Record<DependencyTypes, string[]>>>, onlyWarnsForCheck?: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkIdenticalVersions.d.ts.map