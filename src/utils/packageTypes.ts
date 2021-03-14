import type { Except, PackageJson as PackageJsonFromTypeFest } from 'type-fest';

export type DependencyTypes =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'resolutions';

export type PackageJson = Except<PackageJsonFromTypeFest, 'name'> & {
  name: string;
  resolutionsExplained?: Record<string, string>;
};
