import type {
  DependencyTypes,
  PackageJson,
  RegularDependencyTypes,
} from '../utils/packageTypes';
import { checkPeerDependencies } from './checkPeerDependencies';

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
  depPkgType: RegularDependencyTypes,
  depPkg: PackageJson,
  onlyWarnsFor: string[] = [],
): void {
  if (depPkg.peerDependencies) {
    checkPeerDependencies(
      pkg,
      pkgPathName,
      depPkgType,
      getAllowedPeerInFromType(depPkgType, isLibrary),
      depPkg,
      onlyWarnsFor,
    );
  }
  // TODO optionalPeerDependency
}
