import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
export declare function checkNoDependencies(pkg: PackageJson, pkgPath: string, type?: DependencyTypes, moveToSuggestion?: DependencyTypes, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkNoDependencies.d.ts.map