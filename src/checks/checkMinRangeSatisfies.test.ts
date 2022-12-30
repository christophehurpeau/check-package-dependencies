import type { PackageJson } from '../utils/packageTypes';
import { checkMinRangeSatisfies } from './checkMinRangeSatisfies';

const jest = import.meta.jest;

describe(checkMinRangeSatisfies.name, () => {
  const mockReportError = jest.fn();
  const createReportError = jest.fn().mockReturnValue(mockReportError);

  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when no dependencies is set', () => {
    checkMinRangeSatisfies('path', { name: 'test' });
    expect(mockReportError).not.toHaveBeenCalled();
  });

  describe('expect no error', () => {
    it.each([
      [
        'exact dev dependency and exact dependency',
        {
          dependencies: { test1: '1.1.0' },
          devDependencies: { test1: '1.1.0' },
        },
      ],
      [
        'exact dev dependency and caret range dependency',
        {
          dependencies: { test1: '^1.1.0' },
          devDependencies: { test1: '1.1.0' },
        },
      ],
      [
        'exact dev dependency and tilde range dependency',
        {
          dependencies: { test1: '~1.1.0' },
          devDependencies: { test1: '1.1.0' },
        },
      ],
      [
        'exact dev dependency and >= range dependency',
        {
          dependencies: { test1: '>=1.1.0' },
          devDependencies: { test1: '1.1.0' },
        },
      ],
      [
        'caret range dev dependency and >= range dependency',
        {
          dependencies: { test1: '>=1.1.0' },
          devDependencies: { test1: '^1.1.0' },
        },
      ],
    ])('should have no error when %s', (_, pkgContent) => {
      checkMinRangeSatisfies(
        'path',
        { name: 'test', ...pkgContent },
        'dependencies',
        'devDependencies',
        { customCreateReportError: createReportError },
      );
      expect(mockReportError).not.toHaveBeenCalled();
    });
  });

  describe('expect error when not dependency is invalid', () => {
    it.each([
      [
        'exact dev dependency is higher than exact dependency',
        {
          dependencies: { test1: '1.1.0' },
          devDependencies: { test1: '1.0.0' },
        },
        'Invalid "test1" in dependencies',
        '"1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: '1.0.0' },
        },
      ],
      [
        'exact dev dependency is higher than caret range dependency',
        {
          dependencies: { test1: '^1.0.0' },
          devDependencies: { test1: '1.1.0' },
        },
        'Invalid "test1" in dependencies',
        '"^1.0.0" should satisfies "1.1.0" from "devDependencies".',
        {
          dependencies: { test1: '^1.1.0' },
        },
      ],
      [
        'exact dev dependency is lower than caret range dependency',
        {
          dependencies: { test1: '^1.1.0' },
          devDependencies: { test1: '1.0.0' },
        },
        'Invalid "test1" in dependencies',
        '"^1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: '^1.0.0' },
        },
      ],
      [
        'exact dev dependency is higher than tilde range dependency',
        {
          dependencies: { test1: '~1.0.0' },
          devDependencies: { test1: '1.1.0' },
        },
        'Invalid "test1" in dependencies',
        '"~1.0.0" should satisfies "1.1.0" from "devDependencies".',
        {
          dependencies: { test1: '~1.1.0' },
        },
      ],
      [
        'exact dev dependency is lower than tilde range dependency',
        {
          dependencies: { test1: '~1.1.0' },
          devDependencies: { test1: '1.0.0' },
        },
        'Invalid "test1" in dependencies',
        '"~1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: '~1.0.0' },
        },
      ],
      [
        'exact dev dependency is higher than >= range dependency',
        {
          dependencies: { test1: '>=1.0.0' },
          devDependencies: { test1: '1.1.0' },
        },
        'Invalid "test1" in dependencies',
        '">=1.0.0" should satisfies "1.1.0" from "devDependencies".',
        {
          dependencies: { test1: '>=1.1.0' },
        },
      ],
      [
        'exact dev dependency is lower than >= range dependency',
        {
          dependencies: { test1: '>=1.1.0' },
          devDependencies: { test1: '1.0.0' },
        },
        'Invalid "test1" in dependencies',
        '">=1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: '>=1.0.0' },
        },
      ],
    ])(
      'should error when %s',
      (_, pkgContent, errorTitle, errorInfo, expectedFix) => {
        checkMinRangeSatisfies(
          'path',
          { name: 'test', ...pkgContent },
          'dependencies',
          'devDependencies',
          { customCreateReportError: createReportError },
        );
        expect(mockReportError).toHaveBeenCalledWith(errorTitle, errorInfo);

        if (expectedFix) {
          const pkg = JSON.parse(
            JSON.stringify({ name: 'test', ...pkgContent }),
          ) as PackageJson;
          checkMinRangeSatisfies(
            'path',
            pkg,
            'dependencies',
            'devDependencies',
            { tryToAutoFix: true },
          );

          expect(pkg).toStrictEqual({ ...pkg, ...expectedFix });
        }
      },
    );
  });
});
