import type { GetDependencyPackageJson } from 'utils/createGetDependencyPackageJson';
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
    case 'optionalDependencies':
      return isLibrary
        ? ['dependencies', 'peerDependencies']
        : ['dependencies'];
  }
};

export function checkDirectPeerDependencies(
  isLibrary: boolean,
  pkg: PackageJson,
  pkgPathName: string,
  getDependencyPackageJson: GetDependencyPackageJson,
  missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
): void {
  const reportError = createReportError('Peer Dependencies', pkgPathName);

  regularDependencyTypes.forEach((depType) => {
    if (!pkg[depType]) return;
    getKeys(pkg[depType]).forEach((depName) => {
      const depPkg = getDependencyPackageJson(depName);

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
    });
  });

  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}