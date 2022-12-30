import type { PackageJson } from 'type-fest';
import { createReportError } from '../utils/createReportError';
import type { DependencyTypes } from '../utils/packageTypes';
export interface CheckMinRangeSatisfiesOptions {
    customCreateReportError?: typeof createReportError;
}
export declare function checkMinRangeSatisfies(pkgPathName: string, pkg: PackageJson, type1?: DependencyTypes, type2?: DependencyTypes, { customCreateReportError, }?: CheckMinRangeSatisfiesOptions): void;
//# sourceMappingURL=checkMinRangeSatisfies.d.ts.map