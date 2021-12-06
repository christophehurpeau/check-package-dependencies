import { createReportError } from '../utils/createReportError';
import { checkIdenticalVersions } from './checkIdenticalVersions';

jest.mock('../utils/createReportError');

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
        false,
      );
    });
  });
});
