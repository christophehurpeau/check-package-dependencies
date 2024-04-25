import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkNoDependencies } from './checkNoDependencies';

describe('checkNoDependencies', () => {
  const mockReportError = vi.fn();
  const createReportError = vi.fn().mockReturnValue(mockReportError);

  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when no "dependencies" is present', () => {
    checkNoDependencies(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
      undefined,
      undefined,
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
  it('should return no error when no "devDependencies" is present', () => {
    checkNoDependencies(
      { name: 'test', dependencies: { test: '1.0.0' } },
      'path',
      'devDependencies',
      undefined,
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should return no error when "dependencies" is present', () => {
    checkNoDependencies(
      { name: 'test', dependencies: { test: '1.0.0' } },
      'path',
      undefined,
      undefined,
      createReportError,
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
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected dependencies',
      'you should move them in peerDependencies',
    );
  });
});
