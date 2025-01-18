import type { DependencyValue } from "../utils/packageTypes.ts";

export interface ReportErrorMessage {
  errorMessage: string;
  errorDetails?: string;
  dependency?: Omit<Partial<DependencyValue>, "name"> &
    Pick<DependencyValue, "name">;
  onlyWarns?: boolean;
  autoFixable?: boolean;
}

export type ReportError = (message: ReportErrorMessage) => void;

export type CreateReportError = (
  ruleName: string,
  pkgPathName: string,
) => ReportError;
