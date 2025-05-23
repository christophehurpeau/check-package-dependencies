/* eslint-disable no-console */

import { styleText } from "node:util";
import type { PackageJson } from "type-fest";
import { getEntries } from "../utils/object.ts";
import type { DependencyTypes } from "../utils/packageTypes.ts";
import type {
  OnlyWarnsForCheck,
  OnlyWarnsForMappingCheck,
} from "../utils/warnForUtils.ts";
import { getLocFromDependency } from "./ReportError.ts";
import type { ReportError, ReportErrorDetails } from "./ReportError.ts";

type ReportErrorWithRuleName = ReportErrorDetails & { ruleName: string };

interface ErrorGroup {
  messages: ReportErrorWithRuleName[];
}

const pathMessages = new Map<
  string,
  {
    generalMessages: ReportErrorWithRuleName[];
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
  errorTarget,
  onlyWarns,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  autoFixable,
  fixTo,
  ruleName,
  dependency,
}: ReportErrorWithRuleName): string {
  const location = dependency && getLocFromDependency(dependency, errorTarget);
  const locationString = location
    ? `${location.start.line}:${location.start.column || 0}`
    : "0:0";
  const messageType = onlyWarns
    ? styleText("yellow", "warning")
    : styleText("red", "error");
  const dependencyInfo = dependency
    ? styleText(
        "dim",
        `${dependency.fieldName ? `${dependency.fieldName} > ` : ""}${dependency.name} `,
      )
    : "";
  const details = errorDetails ? `: ${errorDetails}` : "";
  const messageTitle = onlyWarns
    ? styleText("yellow", errorMessage)
    : styleText("red", errorMessage);

  const isFixable = autoFixable || fixTo;
  return `  ${locationString}  ${messageType}  ${dependencyInfo}${messageTitle}${details}  ${styleText("blue", ruleName)}${isFixable ? styleText("dim", " (--fix)") : ""}`;
}

export function logMessage(message: ReportErrorWithRuleName): void {
  if (message.onlyWarns) totalWarnings++;
  else totalErrors++;
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  if (message.autoFixable || message.fixTo) totalFixable++;

  console.error(formatErrorMessage(message));
}

function displayMessagesForPath(
  path: string,
  {
    generalMessages,
    dependencyGroups,
  }: {
    generalMessages: ReportErrorWithRuleName[];
    dependencyGroups: Map<string, ErrorGroup>;
  },
): void {
  console.error(styleText("underline", path));

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
    console.log(styleText("green", "\n✨ No problems found"));
    return;
  }

  const problems = [];
  if (totalErrors) {
    problems.push(
      styleText(
        "red",
        `${totalErrors} ${totalErrors === 1 ? "error" : "errors"}`,
      ),
    );
  }
  if (totalWarnings) {
    problems.push(
      styleText(
        "yellow",
        `${totalWarnings} ${totalWarnings === 1 ? "warning" : "warnings"}`,
      ),
    );
  }

  console.log(`\n✖ Found ${problems.join(" and ")}`);

  if (totalFixable) {
    console.log(
      styleText(
        "dim",
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

export function createCliReportError(
  ruleName: string,
  pkgPathName: string,
): ReportError {
  return function reportError(message: ReportErrorDetails): void {
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
