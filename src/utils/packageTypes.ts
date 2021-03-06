import type { Except, PackageJson as PackageJsonFromTypeFest } from 'type-fest';

export type RegularDependencyTypes =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';

export type DependencyTypes =
  | RegularDependencyTypes
  | 'peerDependencies'
  | 'resolutions';

export type PackageJson = Except<PackageJsonFromTypeFest, 'name'> & {
  name: string;
  resolutionsExplained?: Record<string, string>;
};
