import type { Except, PackageJson as PackageJsonFromTypeFest } from 'type-fest';

export type RegularDependencyTypes =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies';

export type DependencyTypes =
  | RegularDependencyTypes
  | 'peerDependencies'
  | 'resolutions';

export type DependencyName = string;

type Dependency = Record<string, string>;

export type PackageJson = Except<PackageJsonFromTypeFest, 'name'> &
  Partial<Record<DependencyTypes, Dependency>> & {
    name: string;
    resolutionsExplained?: Record<string, string>;
  };

export type DependenciesRanges = Partial<
  Record<DependencyTypes, Record<DependencyName, string | null>>
>;
