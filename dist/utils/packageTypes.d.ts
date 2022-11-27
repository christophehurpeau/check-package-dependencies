import type { Except, PackageJson as PackageJsonFromTypeFest } from 'type-fest';
export type RegularDependencyTypes = 'dependencies' | 'devDependencies' | 'optionalDependencies';
export type DependencyTypes = RegularDependencyTypes | 'peerDependencies' | 'resolutions';
export type DependencyName = string;
type Dependency = Record<string, string>;
export type PackageJson = Except<PackageJsonFromTypeFest, 'name'> & {
    name: string;
    resolutionsExplained?: Record<string, string>;
} & Partial<Record<DependencyTypes, Dependency>>;
export {};
//# sourceMappingURL=packageTypes.d.ts.map