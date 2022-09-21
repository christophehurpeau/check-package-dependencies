import { createReportError } from '../utils/createReportError';
import { checkSatisfiesVersions } from './checkSatisfiesVersions';

jest.mock('../utils/createReportError', () => ({
  ...jest.requireActual('../utils/createReportError'),
  createReportError: jest.fn(),
}));

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkSatisfiesVersions', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when range is satisfied', () => {
    checkSatisfiesVersions(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
      'devDependencies',
      { test: '^1.0.0' },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should return error when version not satisfied', () => {
    checkSatisfiesVersions(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
      'devDependencies',
      { test: '^2.0.0' },
    );
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Invalid "test" in devDependencies',
      '"1.0.0" (in "test") should satisfies "^2.0.0".',
      undefined,
    );
  });
  it('should return error when dependency is missing', () => {
    checkSatisfiesVersions(
      { name: 'test', devDependencies: { test2: '1.0.0' } },
      'path',
      'devDependencies',
      { test: '^1.0.0' },
    );
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Missing "test" in devDependencies',
      'should satisfies "^1.0.0".',
      undefined,
    );
  });
});
