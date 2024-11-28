/* eslint-disable no-console */

import chalk from "chalk";
import { getEntries } from "./object.ts";
import type {
  OnlyWarnsForCheck,
  OnlyWarnsForMappingCheck,
} from "./warnForUtils.ts";

export type ReportError = (
  msgTitle: string,
  msgInfo?: string,
  onlyWarns?: boolean,
  autoFixable?: boolean,
) => void;

let titleDisplayed: string | null = null;
let pkgPathDisplayed: string | null = null;

let totalWarnings = 0;
let totalErrors = 0;
let totalFixable = 0;

export function displayConclusion(): void {
  if (!totalWarnings && !totalErrors) {
    console.log(`\n${chalk.green("✅ No errors or warnings found")}.`);
  } else if (!totalErrors) {
    console.log(`\nFound ${chalk.yellow(`${totalWarnings} warnings`)}.`);
  } else if (!totalWarnings) {
    console.log(`\nFound ${chalk.red(`${totalErrors} errors`)}.`);
  } else {
    console.log(
      `\nFound ${chalk.red(`${totalErrors} errors`)} and ${chalk.yellow(
        `${totalWarnings} warnings`,
      )}.`,
    );
  }

  if (totalFixable) {
    console.log(
      `Found ${chalk.green(
        `${totalFixable} auto-fixable`,
      )} errors or warnings, run the command with "--fix" to fix them.`,
    );
  }
}

export function logMessage(
  msgTitle: string,
  msgInfo?: string,
  onlyWarns?: boolean,
  autoFixable?: boolean,
): void {
  if (onlyWarns) totalWarnings++;
  else totalErrors++;
  if (autoFixable) totalFixable++;
  console.error(
    `${
      onlyWarns ? chalk.yellow(`⚠ ${msgTitle}`) : chalk.red(`❌ ${msgTitle}`)
    }${msgInfo ? `: ${msgInfo}` : ""}${
      autoFixable ? ` ${chalk.bgGreenBright(chalk.black("auto-fixable"))}` : ""
    }`,
  );
}

export function createReportError(
  title: string,
  pkgPathName: string,
): ReportError {
  return function reportError(
    msgTitle,
    msgInfo,
    onlyWarns,
    autoFixable = false,
  ): void {
    if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk.cyan(`== ${title} in ${pkgPathName} ==`));
      titleDisplayed = title;
      pkgPathDisplayed = pkgPathName;
    }
    logMessage(msgTitle, msgInfo, onlyWarns, autoFixable);

    if (!onlyWarns) {
      // console.trace();
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
    reportError(
      `Invalid config in "${onlyWarnsForCheck.configName}"`,
      `no warning was raised for ${notWarnedFor
        .map((depName) => `"${depName}"`)
        .join(", ")}`,
      false,
    );
  }
}

export function reportNotWarnedForMapping(
  reportError: ReportError,
  onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck,
): void {
  const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
  getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
    reportError(
      `Invalid config in "${onlyWarnsForMappingCheck.configName}" for "${depNameOrStar}"`,
      `no warning was raised for ${notWarnedFor
        .map((depName) => `"${depName}"`)
        .join(", ")}`,
    );
  });
}
