import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import {
  createReportError,
  reportNotWarnedForMapping,
} from '../utils/createReportError';
import { getKeys } from '../utils/object';
import type {
  DependencyTypes,
  PackageJson,
  RegularDependencyTypes,
} from '../utils/packageTypes';
import type { OnlyWarnsForMappingCheck } from '../utils/warnForUtils';
import { checkPeerDependencies } from './checkPeerDependencies';

const regularDependencyTypes: RegularDependencyTypes[] = [
  'devDependencies',
  'dependencies',
  'optionalDependencies',
];

const getAllowedPeerInFromType = (
  depPkgType: RegularDependencyTypes,
  isLibrary: boolean,
): DependencyTypes[] => {
  switch (depPkgType) {
    case 'devDependencies':
      return ['devDependencies', 'dependencies'];
    case 'dependencies':
      return isLibrary
        ? ['dependencies', 'peerDependencies']
        : ['devDependencies', 'dependencies'];
    case 'optionalDependencies':
      return isLibrary
        ? ['dependencies', 'optionalDependencies', 'peerDependencies']
        : ['devDependencies', 'dependencies'];
  }
};

export async function checkDirectPeerDependencies(
  isLibrary: boolean,
  pkg: PackageJson,
  pkgPathName: string,
  getDependencyPackageJson: GetDependencyPackageJson,
  missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  customCreateReportError = createReportError,
): Promise<void> {
  const reportError = customCreateReportError('Peer Dependencies', pkgPathName);

  await Promise.all(
    regularDependencyTypes.map(async (depType) => {
      const dependencies = pkg[depType];
      if (!dependencies) return;
      for (const depName of getKeys(dependencies)) {
        const depPkg = await getDependencyPackageJson(depName);

        if (depPkg.peerDependencies) {
          checkPeerDependencies(
            pkg,
            reportError,
            depType,
            getAllowedPeerInFromType(depType, isLibrary),
            depPkg,
            missingOnlyWarnsForCheck.createFor(depName),
            invalidOnlyWarnsForCheck.createFor(depName),
          );
        }
      }
    }),
  );

  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}
