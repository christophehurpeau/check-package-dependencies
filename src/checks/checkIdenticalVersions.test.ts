import { createReportError } from '../utils/createReportError';
import { checkIdenticalVersions } from './checkIdenticalVersions';

jest.mock('../utils/createReportError', () => ({
  ...jest.requireActual('../utils/createReportError'),
  createReportError: jest.fn(),
}));

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkIdenticalVersions', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });

  describe('devDependencies in array', () => {
    it('should return no error when all versions are identical', () => {
      checkIdenticalVersions(
        {
          name: 'test',
          devDependencies: { react: '1.0.0', 'react-dom': '1.0.0' },
        },
        'path',
        'devDependencies',
        {
          react: ['react-dom'],
        },
      );
      expect(createReportError).toHaveBeenCalledWith(
        'Identical Versions',
        'path',
      );
      expect(mockReportError).not.toHaveBeenCalled();
    });

    it('should return error when versions are not identical', () => {
      checkIdenticalVersions(
        {
          name: 'test',
          devDependencies: { react: '1.0.0', 'react-dom': '1.0.1' },
        },
        'path',
        'devDependencies',
        {
          react: ['react-dom'],
        },
      );
      expect(createReportError).toHaveBeenCalledWith(
        'Identical Versions',
        'path',
      );
      expect(mockReportError).toHaveBeenCalledTimes(1);
      expect(mockReportError).toHaveBeenCalledWith(
        'Invalid "react-dom" in devDependencies',
        'expecting "1.0.1" be "1.0.0".',
        undefined,
      );
    });
  });

  describe('object with dependencies and devDependencies', () => {
    it('should return no error when all versions are identical', () => {
      checkIdenticalVersions(
        {
          name: 'test',
          dependencies: { react: '1.0.0', 'react-dom': '1.0.0' },
          devDependencies: { 'react-test-renderer': '1.0.0' },
        },
        'path',
        'dependencies',
        {
          react: {
            dependencies: ['react-dom'],
            devDependencies: ['react-test-renderer'],
          },
        },
      );
      expect(createReportError).toHaveBeenCalledWith(
        'Identical Versions',
        'path',
      );
      expect(mockReportError).not.toHaveBeenCalled();
    });

    it('should return error when versions are not identical', () => {
      checkIdenticalVersions(
        {
          name: 'test',
          dependencies: { react: '1.0.0', 'react-dom': '1.0.1' },
          devDependencies: { 'react-test-renderer': '1.0.1' },
        },
        'path',
        'dependencies',
        {
          react: {
            dependencies: ['react-dom'],
            devDependencies: ['react-test-renderer'],
          },
        },
      );
      expect(createReportError).toHaveBeenCalledWith(
        'Identical Versions',
        'path',
      );
      expect(mockReportError).toHaveBeenCalledTimes(2);
      expect(mockReportError).toHaveBeenCalledWith(
        'Invalid "react-dom" in dependencies',
        'expecting "1.0.1" be "1.0.0".',
        undefined,
      );
      expect(mockReportError).toHaveBeenCalledWith(
        'Invalid "react-test-renderer" in devDependencies',
        'expecting "1.0.1" be "1.0.0".',
        undefined,
      );
    });
  });
});
