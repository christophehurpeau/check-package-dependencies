import semverUtils from "semver-utils";
export declare const parse: typeof semverUtils.parse;
export declare const parseRange: typeof semverUtils.parseRange;
export declare function getOperator(range: string): string | null;
export declare function changeOperator(range: string, operator: string | null): string | null;
export declare function isExactParsedRange(parsedRange: ReturnType<typeof semverUtils.parseRange>): boolean;
export declare function isExactRange(range: string): boolean;
export declare function getRealVersion(version: string): string;
//# sourceMappingURL=semverUtils.d.ts.map