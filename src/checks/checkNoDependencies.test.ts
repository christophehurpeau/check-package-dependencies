import { createReportError } from '../utils/createReportError';
import { checkNoDependencies } from './checkNoDependencies';

jest.mock('../utils/createReportError');

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkNoDependencies', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when no "dependencies" is present', () => {
    checkNoDependencies(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
  it('should return no error when no "devDependencies" is present', () => {
    checkNoDependencies(
      { name: 'test', dependencies: { test: '1.0.0' } },
      'path',
      'devDependencies',
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should return no error when "dependencies" is present', () => {
    checkNoDependencies(
      { name: 'test', dependencies: { test: '1.0.0' } },
      'path',
    );
    expect(createReportError).toHaveBeenCalledWith('No dependencies', 'path');
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected dependencies',
      'you should move them in devDependencies',
    );
  });

  it('should return no error when "dependencies" is present, with suggestion', () => {
    checkNoDependencies(
      { name: 'test', dependencies: { test: '1.0.0' } },
      'path',
      'dependencies',
      'peerDependencies',
    );
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected dependencies',
      'you should move them in peerDependencies',
    );
  });
});
