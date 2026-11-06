import semver from "semver";
import type { SemVer } from "semver-utils";
import semverUtils from "semver-utils";

export const parse = semverUtils.parse;
export const parseRange = semverUtils.parseRange;

// semverUtils.stringify does not support the operator
function stringify(semver: SemVer): string {
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

export function getOperator(range: string): string | null {
  const parsedRange = parseRange(range);
  if (parsedRange.length !== 1) return null;
  return parsedRange[0]?.operator || "";
}

export function changeOperator(
  range: string,
  operator: string | null,
): string | null {
  if (operator === null) return range;
  const parsedRange = parseRange(range);
  if (parsedRange.length !== 1) return null;
  const parsed = parsedRange[0];
  if (!parsed) return null;
  parsed.operator = operator === "" ? undefined : operator;
  return stringify(parsed);
}

export function isExactParsedRange(
  parsedRange: ReturnType<typeof semverUtils.parseRange>,
): boolean {
  return parsedRange.length === 1 && parsedRange[0]?.operator === undefined;
}

export function isExactRange(range: string): boolean {
  return isExactParsedRange(parseRange(range));
}

export interface NpmAlias {
  aliasedName: string;
  range: string;
}

/**
 * Parses an alias to another package, `npm:name@range`, returning null for any
 * other value. The range is optional, `npm:name` aliasing its latest version.
 */
export function parseNpmAlias(version: string): NpmAlias | null {
  if (!version.startsWith("npm:")) return null;
  const target = version.slice("npm:".length);
  const rangeSeparatorIndex = target.indexOf(
    "@",
    target.startsWith("@") ? 1 : 0,
  );
  if (rangeSeparatorIndex === -1) return { aliasedName: target, range: "*" };
  return {
    aliasedName: target.slice(0, rangeSeparatorIndex),
    range: target.slice(rangeSeparatorIndex + 1) || "*",
  };
}

export function getRealVersion(version: string): string {
  const npmAlias = parseNpmAlias(version);
  if (npmAlias) return npmAlias.range;

  if (version.startsWith("workspace:")) {
    const realVersion = version.slice("workspace:".length);
    // "workspace:~" and "workspace:^" are shorthands resolved to the
    // package's own version at publish time; there is no version to check here.
    if (realVersion === "~" || realVersion === "^") return "*";
    return realVersion;
  }

  return version;
}

/**
 * Whether a dependency specifier is a semver range. Anything else — `link:`, `portal:`,
 * `file:`, a git or url specifier, a dist-tag — cannot be ordered or intersected, and the
 * `semver` functions that parse a range (`minVersion`, `intersects`) throw on it.
 */
export function isSemverRange(spec: string): boolean {
  return semver.validRange(spec) !== null;
}

/** A dist-tag such as `next` or `latest`: an identifier with no protocol, path or version. */
export function isDistTag(spec: string): boolean {
  return /^[a-z][\w.-]*$/i.test(spec) && !isSemverRange(spec);
}

/** `semver.minVersion` for a specifier that may not be a range: null instead of a throw. */
export function minVersionOrNull(spec: string): semver.SemVer | null {
  return isSemverRange(spec) ? semver.minVersion(spec) : null;
}

/**
 * `semver.intersects` for specifiers that may not be ranges. A specifier that is not a
 * semver range can only be compared by equality, so two of them intersect when they are
 * the same string, and one of them against a range never does.
 */
export function specsIntersect(
  spec: string,
  otherSpec: string,
  options?: semver.RangeOptions,
): boolean {
  if (spec === otherSpec) return true;
  if (!isSemverRange(spec) || !isSemverRange(otherSpec)) return false;
  return semver.intersects(spec, otherSpec, options);
}
