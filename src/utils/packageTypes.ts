import type { PackageJson as PackageJsonFromTypeFest } from "type-fest";

export type RegularDependencyTypes =
  | "dependencies"
  | "devDependencies"
  | "optionalDependencies";

export type DependencyTypes =
  | RegularDependencyTypes
  | "peerDependencies"
  | "resolutions"
  | "resolutionsExplained";

export type DependencyFieldTypes = DependencyTypes | "resolutionsExplained";

export type DependencyName = string;

export interface Location {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface DependencyValue {
  fieldName: DependencyFieldTypes;
  name: string;
  value: string;
  changeValue: (newValue: string) => void;
  locations: {
    all: Location;
    name: Location;
    value: Location;
  };
  ranges: {
    all: [number, number];
    name: [number, number];
    value: [number, number];
  };
  toString: () => string;
}

// eslint-disable-next-line @typescript-eslint/sort-type-constituents
export type ParsedPackageJson = {
  readonly name: string;
  readonly path: string;
  readonly value: Readonly<PackageJson>;
  readonly resolutionsExplained?: Readonly<
    Record<string, Readonly<DependencyValue>>
  >;
  change: (
    type: DependencyTypes,
    dependencyName: string,
    newValue: string,
  ) => void;
} & Readonly<
  Partial<
    Record<DependencyTypes, Partial<Record<string, Readonly<DependencyValue>>>>
  >
>;

export type PackageJson = PackageJsonFromTypeFest &
  Partial<Record<DependencyTypes, Record<string, string>>> & {
    resolutionsExplained?: Record<string, string>;
  };

export type DependenciesRanges = Partial<
  Record<DependencyTypes, Record<DependencyName, string | null>>
>;
