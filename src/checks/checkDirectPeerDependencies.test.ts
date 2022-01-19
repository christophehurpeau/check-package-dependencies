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

  it('should report error when peer dependency is missing', () => {
    checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      'devDependencies',
      {
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
      },
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in devDependencies',
      'it should satisfies "^1.0.0" and be in devDependencies or dependencies',
      false,
    );
  });

  it('should not report error when peer dependency is in devDependencies', () => {
    checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { rollup: '^1.0.0', 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      'devDependencies',
      {
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when peer dependency value is *', () => {
    checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { rollup: '^1.0.0', 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      'devDependencies',
      {
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '*' },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should allow lib to have peer in both dependencies and peerDependencies', () => {
    checkDirectPeerDependencies(
      true,
      {
        name: 'test',
        peerDependencies: { rollup: '^1.0.0' },
        dependencies: { rollup: '^1.0.0' },
        devDependencies: { 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      'devDependencies',
      {
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should allow missing peer dependency when optional', () => {
    checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      'devDependencies',
      {
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
        peerDependenciesMeta: {
          rollup: { optional: true },
        },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
