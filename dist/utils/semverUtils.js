import semverUtils from "semver-utils";
export const parse = semverUtils.parse;
export const parseRange = semverUtils.parseRange;
// semverUtils.stringify does not support the operator
function stringify(semver) {
    let str = "";
    if (semver.operator) {
        str += semver.operator;
    }
    str += semver.major || "0";
    str += ".";
    str += semver.minor || "0";
    str += ".";
    str += semver.patch || "0";
    if (semver.release) {
        str += `-${semver.release}`;
    }
    if (semver.build) {
        str += `+${semver.build}`;
    }
    return str;
}
export function getOperator(range) {
    const parsedRange = parseRange(range);
    if (parsedRange.length !== 1)
        return null;
    return parsedRange[0].operator || "";
}
export function changeOperator(range, operator) {
    if (operator === null)
        return range;
    const parsedRange = parseRange(range);
    if (parsedRange.length !== 1)
        return null;
    const parsed = parsedRange[0];
    parsed.operator = operator === "" ? undefined : operator;
    return stringify(parsed);
}
export function isExactParsedRange(parsedRange) {
    return parsedRange.length === 1 && parsedRange[0].operator === undefined;
}
export function isExactRange(range) {
    return isExactParsedRange(parseRange(range));
}
export function getRealVersion(version) {
    if (version.startsWith("npm:")) {
        const match = /^npm:[^@]+@(.*)$/.exec(version);
        if (!match)
            throw new Error(`Invalid version match: ${version}`);
        const [, realVersion] = match;
        return realVersion;
    }
    if (version.startsWith("workspace:")) {
        return version.slice("workspace:".length);
    }
    return version;
}
//# sourceMappingURL=semverUtils.js.map