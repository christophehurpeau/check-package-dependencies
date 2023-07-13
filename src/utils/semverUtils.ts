import type { SemVer } from 'semver-utils';
import semverUtils from 'semver-utils';

export const parse = semverUtils.parse;
export const parseRange = semverUtils.parseRange;

// semverUtils.stringify does not support the operator
function stringify(semver: SemVer): string {
  let str = '';
  if (semver.operator) {
    str += semver.operator;
  }
  str += semver.major || '0';
  str += '.';
  str += semver.minor || '0';
  str += '.';
  str += semver.patch || '0';
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
  return parsedRange[0].operator || '';
}

export function changeOperator(
  range: string,
  operator: string | null,
): string | null {
  if (operator === null) return range;
  const parsedRange = parseRange(range);
  if (parsedRange.length !== 1) return null;
  const parsed = parsedRange[0];
  parsed.operator = operator === '' ? undefined : operator;
  return stringify(parsed);
}

export function isExactParsedRange(
  parsedRange: ReturnType<typeof semverUtils.parseRange>,
): boolean {
  return parsedRange.length === 1 && parsedRange[0].operator === undefined;
}

export function isExactRange(range: string): boolean {
  return isExactParsedRange(parseRange(range));
}
