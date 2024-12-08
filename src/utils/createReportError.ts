/* eslint-disable no-console */

import chalk from "chalk";
import type { Except, PackageJson } from "type-fest";
import { getEntries } from "./object.ts";
import type { DependencyTypes, DependencyValue } from "./packageTypes.ts";
import type {
  OnlyWarnsForCheck,
  OnlyWarnsForMappingCheck,
} from "./warnForUtils.ts";

export interface ReportErrorMessage {
  ruleName: string;
  errorMessage: string;
  errorDetails?: string;
  dependency?: Omit<Partial<DependencyValue>, "name"> &
    Pick<DependencyValue, "name">;
  onlyWarns?: boolean;
  autoFixable?: boolean;
}

export type ReportError = (
  message: Except<ReportErrorMessage, "ruleName">,
) => void;

interface ErrorGroup {
  messages: ReportErrorMessage[];
}

const pathMessages = new Map<
  string,
  {
    generalMessages: ReportErrorMessage[];
    dependencyGroups: Map<string, ErrorGroup>;
  }
>();

let totalWarnings = 0;
let totalErrors = 0;
let totalFixable = 0;

// eslint-disable-next-line complexity
function formatErrorMessage({
  errorMessage,
  errorDetails,
  onlyWarns,
  autoFixable,
  ruleName,
  dependency,
}: ReportErrorMessage): string {
  const location = dependency?.line
    ? `${dependency.line}:${dependency.column || 0}`
    : "0:0";
  const messageType = onlyWarns ? chalk.yellow("warning") : chalk.red("error");
  const dependencyInfo = dependency
    ? chalk.gray(
        `${dependency.fieldName ? `${dependency.fieldName} > ` : ""}${dependency.name} `,
      )
    : "";
  const details = errorDetails ? `: ${errorDetails}` : "";
  const messageTitle = onlyWarns
    ? chalk.yellow(errorMessage)
    : chalk.red(errorMessage);

  return `  ${location}  ${messageType}  ${dependencyInfo}${messageTitle}${details}  ${chalk.blue(ruleName)}${autoFixable ? chalk.gray(" (--fix)") : ""}`;
}

export function logMessage(message: ReportErrorMessage): void {
  if (message.onlyWarns) totalWarnings++;
  else totalErrors++;
  if (message.autoFixable) totalFixable++;

  console.error(formatErrorMessage(message));
}

function displayMessagesForPath(
  path: string,
  {
    generalMessages,
    dependencyGroups,
  }: {
    generalMessages: ReportErrorMessage[];
    dependencyGroups: Map<string, ErrorGroup>;
  },
): void {
  console.error(chalk.underline(path));

  // Display general messages first
  if (generalMessages.length > 0) {
    for (const message of generalMessages) {
      logMessage(message);
    }
  }

  // Then display dependency groups
  for (const [, group] of dependencyGroups) {
    for (const message of group.messages) {
      logMessage(message);
    }
  }

  console.error(); // Add empty line between files
}

function displayConclusion(): void {
  if (!totalWarnings && !totalErrors) {
    console.log(chalk.green("\n✨ No problems found"));
    return;
  }

  const problems = [];
  if (totalErrors) {
    problems.push(
      chalk.red(`${totalErrors} ${totalErrors === 1 ? "error" : "errors"}`),
    );
  }
  if (totalWarnings) {
    problems.push(
      chalk.yellow(
        `${totalWarnings} ${totalWarnings === 1 ? "warning" : "warnings"}`,
      ),
    );
  }

  console.log(`\n✖ Found ${problems.join(" and ")}`);

  if (totalFixable) {
    console.log(
      chalk.gray(
        `\n${totalFixable} ${totalFixable === 1 ? "issue" : "issues"} fixable with the --fix option`,
      ),
    );
  }
}

export function displayMessages(): void {
  // Display all collected messages
  for (const [path, pathData] of pathMessages) {
    displayMessagesForPath(path, pathData);
  }

  displayConclusion();
}

export function createReportError(
  ruleName: string,
  pkgPathName: string,
): ReportError {
  return function reportError(
    message: Except<ReportErrorMessage, "ruleName">,
  ): void {
    let pathData = pathMessages.get(pkgPathName);
    if (!pathData) {
      pathData = {
        generalMessages: [],
        dependencyGroups: new Map(),
      };
      pathMessages.set(pkgPathName, pathData);
    }

    if (message.dependency) {
      const dependencyKey = `${
        message.dependency.fieldName ? `${message.dependency.fieldName} > ` : ""
      }${message.dependency.name}`;
      let group = pathData.dependencyGroups.get(dependencyKey);
      if (!group) {
        group = { messages: [] };
        pathData.dependencyGroups.set(dependencyKey, group);
      }
      group.messages.push({ ...message, ruleName });
    } else {
      pathData.generalMessages.push({ ...message, ruleName });
    }

    if (!message.onlyWarns) {
      process.exitCode = 1;
    }
  };
}

export function reportNotWarnedFor(
  reportError: ReportError,
  onlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
  if (notWarnedFor.length > 0) {
    reportError({
      errorMessage: `Invalid config in "${onlyWarnsForCheck.configName}"`,
      errorDetails: `no warning was raised for ${notWarnedFor
        .map((depName) => `"${depName}"`)
        .join(", ")}`,
    });
  }
}

export function reportNotWarnedForMapping(
  reportError: ReportError,
  onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck,
): void {
  const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
  getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
    reportError({
      errorMessage: `Invalid config in "${onlyWarnsForMappingCheck.configName}"`,
      errorDetails: `no warning was raised for ${notWarnedFor
        .map((depName) => `"${depName}"`)
        .join(", ")}`,
    });
  });
}

export function resetMessages(): void {
  pathMessages.clear();
  totalWarnings = 0;
  totalErrors = 0;
  totalFixable = 0;
}

export function fromDependency(
  depPkg: PackageJson,
  depType?: DependencyTypes,
): string {
  return `from "${depPkg.name || ""}"${depType ? ` in "${depType}"` : ""}`;
}

export function inDependency(
  depPkg: PackageJson,
  depType?: DependencyTypes,
): string {
  return `in ${depType ? `"${depType}" of ` : ""}"${depPkg.name || ""}"`;
}
