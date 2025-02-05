import type { DependencyValue, Location } from "../utils/packageTypes.ts";

export interface ReportErrorDetails {
  errorMessage: string;
  errorDetails?: string;
  errorTarget?: "dependencyName" | "dependencyValue";
  dependency?: Omit<Partial<DependencyValue>, "name"> &
    Pick<DependencyValue, "name">;
  onlyWarns?: boolean;
  /** @deprecated use fixTo or suggestTo instead */
  autoFixable?: boolean;
  fixTo?: string;
  suggestions?: [
    dependencyValue: Omit<Partial<DependencyValue>, "name"> &
      Pick<DependencyValue, "name">,
    fixTo: string,
    description: string,
  ][];
}

export type ReportError = (details: ReportErrorDetails) => void;

export type CreateReportError = (
  ruleName: string,
  pkgPathName: string,
) => ReportError;

export const getLocFromDependency = (
  dependency: Partial<DependencyValue>,
  errorTarget: ReportErrorDetails["errorTarget"],
): Location | undefined => {
  if (!dependency.locations) {
    return undefined;
  }

  if (errorTarget === "dependencyName") {
    return dependency.locations.name;
  }
  if (errorTarget === "dependencyValue") {
    return dependency.locations.value;
  }
  return dependency.locations.all;
};
