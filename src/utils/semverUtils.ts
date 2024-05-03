import semverUtils from 'semver-utils';

export const parse = semverUtils.parse;
export const parseRange = semverUtils.parseRange;

export function isExactParsedRange(
  parsedRange: ReturnType<typeof semverUtils.parseRange>,
): boolean {
  return parsedRange.length === 1 && parsedRange[0].operator === undefined;
}

export function isExactRange(range: string): boolean {
  return isExactParsedRange(parseRange(range));
}
