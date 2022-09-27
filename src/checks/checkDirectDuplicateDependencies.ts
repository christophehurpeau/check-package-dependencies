import type { GetDependencyPackageJson } from 'utils/createGetDependencyPackageJson';
import {
  reportNotWarnedForMapping,
  createReportError,
} from '../utils/createReportError';
import { getKeys } from '../utils/object';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForMappingCheck } from '../utils/warnForUtils';
import { checkDuplicateDependencies } from './checkDuplicateDependencies';

export function checkDirectDuplicateDependencies(
  pkg: PackageJson,
  pkgPathName: string,
  depType: DependencyTypes,
  getDependencyPackageJson: GetDependencyPackageJson,
  onlyWarnsForCheck: OnlyWarnsForMappingCheck,
  reportErrorNamePrefix = '',
): void {
  const reportError = createReportError(
    `${reportErrorNamePrefix}Direct Duplicate Dependencies`,
    pkgPathName,
  );

  const checks: {
    type: DependencyTypes;
    searchIn: DependencyTypes[];
  }[] = [
    {
      type: 'devDependencies',
      searchIn: ['devDependencies', 'dependencies'],
    },
    { type: 'dependencies', searchIn: ['devDependencies', 'dependencies'] },
  ];
  checks.forEach(({ type, searchIn }) => {
    const dependencies = pkg[type];
    if (!dependencies) return;
    getKeys(dependencies).forEach((depName) => {
      const depPkg = getDependencyPackageJson(depName);
      checkDuplicateDependencies(
        reportError,
        pkg,
        depType,
        searchIn,
        depPkg,
        onlyWarnsForCheck.createFor(depName),
      );
    });
  });

  reportNotWarnedForMapping(reportError, onlyWarnsForCheck);
}
