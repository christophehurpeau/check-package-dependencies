import type { Except, PackageJson as PackageJsonFromTypeFest } from 'type-fest';
export declare type RegularDependencyTypes = 'dependencies' | 'devDependencies' | 'optionalDependencies';
export declare type DependencyTypes = RegularDependencyTypes | 'peerDependencies' | 'resolutions';
export declare type PackageJson = Except<PackageJsonFromTypeFest, 'name'> & {
    name: string;
    resolutionsExplained?: Record<string, string>;
};
//# sourceMappingURL=packageTypes.d.ts.map