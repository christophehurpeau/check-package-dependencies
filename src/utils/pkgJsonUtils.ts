import { readFileSync, writeFileSync } from 'node:fs';
import { resolve as importResolve } from 'import-meta-resolve';
import type { PackageJson } from './packageTypes';

export function readPkgJson(packagePath: string): PackageJson {
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJson;
}

export function writePkgJson(packagePath: string, pkg: PackageJson): void {
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}

/** @internal */
export function internalLoadPackageJsonFromNodeModules(
  pkgDepName: string,
  pkgDirname: string,
): PackageJson {
  const packageUrl = importResolve(
    `${pkgDepName}/package.json`,
    `file://${pkgDirname}/package.json`,
  );
  return readPkgJson(
    packageUrl.replace(
      process.platform === 'win32' ? /^file:\/{3}/ : /^file:\/\//,
      '',
    ),
  );
}
