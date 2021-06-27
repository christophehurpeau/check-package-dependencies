import { createReportError } from '../utils/createReportError';
import { checkDirectPeerDependencies } from './checkDirectPeerDependencies';

jest.mock('../utils/createReportError');

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkDirectPeerDependencies', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should allow lib to have peer in both dependencies and peerDependencies', () => {
    checkDirectPeerDependencies(
      true,
      {
        name: 'test',
        peerDependencies: { rollup: '^1.0.0' },
        dependencies: { rollup: '^1.0.0' },
        devDependencies: { test: '1.0.0' },
      },
      'path',
      'dependencies',
      {
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
