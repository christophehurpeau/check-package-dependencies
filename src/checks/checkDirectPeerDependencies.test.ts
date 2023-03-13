/* eslint-disable max-lines */
import { createOnlyWarnsForMappingCheck } from '../utils/warnForUtils';
import { checkDirectPeerDependencies } from './checkDirectPeerDependencies';

const jest = import.meta.jest;

describe('checkDirectPeerDependencies', () => {
  const mockReportError = jest.fn();
  const createReportError = jest.fn().mockReturnValue(mockReportError);
  beforeEach(() => {
    mockReportError.mockReset();
  });

  it('should report error when peer dependency is missing', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      jest.fn().mockImplementationOnce(() => ({
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
      })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in devDependencies',
      'it should satisfies "^1.0.0" and be in devDependencies or dependencies',
      false,
    );
  });

  it('should not report error when peer dependency is in devDependencies', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { rollup: '^1.0.0', 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: 'rollup',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-rollup',
          peerDependencies: { rollup: '^1.0.0' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when peer dependency value is *', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { rollup: '^1.0.0', 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: 'rollup',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-rollup',
          peerDependencies: { rollup: '*' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when dev dependency value is a beta', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: {
          rollup: '^1.0.0-beta.0',
          'some-lib-using-rollup': '1.0.0',
        },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: 'rollup',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-rollup',
          peerDependencies: { rollup: '*' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when dev dependency and peerDependency value are a beta', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: {
          rollup: '1.0.0-beta.15',
          'some-lib-using-rollup': '1.0.0',
        },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: 'rollup',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-rollup',
          peerDependencies: { rollup: '^1.0.0-beta.15' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should allow lib to have peer in both dependencies and peerDependencies', async () => {
    await checkDirectPeerDependencies(
      true,
      {
        name: 'test',
        peerDependencies: { rollup: '^1.0.0' },
        dependencies: { rollup: '^1.0.0' },
        devDependencies: { 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: 'rollup',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-rollup',
          peerDependencies: { rollup: '^1.0.0' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should allow missing peer dependency when optional', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        devDependencies: { 'some-lib-using-rollup': '1.0.0' },
      },
      'path',
      jest.fn().mockImplementationOnce(() => ({
        name: 'some-lib-using-rollup',
        peerDependencies: { rollup: '^1.0.0' },
        peerDependenciesMeta: {
          rollup: { optional: true },
        },
      })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when @types is in dev dependency of an app', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        dependencies: {
          'some-lib-using-types': '1.0.0',
        },
        devDependencies: {
          '@types/a': '1.0.0',
        },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: '@types/a',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-types',
          peerDependencies: { '@types/a': '^1.0.0' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when @types is missing in dependencies/peerDependency of a library', async () => {
    await checkDirectPeerDependencies(
      true,
      {
        name: 'test',
        dependencies: {
          'some-lib-using-types': '1.0.0',
        },
        devDependencies: {
          '@types/a': '1.0.0',
        },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: '@types/a',
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-types',
          peerDependencies: { '@types/a': '^1.0.0' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "@types/a" peer dependency from "some-lib-using-types" in dependencies',
      'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
      false,
    );
  });

  it('should not report error when peer dependency is provided by another dependency', async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: 'test',
        dependencies: {
          'some-lib-using-rollup': '1.0.0',
          'some-lib-providing-rollup': '1.0.0',
        },
      },
      'path',
      jest
        .fn()
        .mockImplementationOnce(() => ({
          name: 'some-lib-providing-rollup',
          dependencies: { rollup: '^1.0.0' },
        }))
        .mockImplementationOnce(() => ({
          name: 'some-lib-using-rollup',
          peerDependencies: { rollup: '^1.0.0' },
        })),
      createOnlyWarnsForMappingCheck('test', []),
      createOnlyWarnsForMappingCheck('test', []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
