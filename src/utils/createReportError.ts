/* eslint-disable no-console */

import chalk from 'chalk';

export type ReportError = (
  msgTitle: string,
  msgInfo?: string,
  onlyWarns?: boolean,
) => void;

let titleDisplayed: string | null = null;
let pkgPathDisplayed: string | null = null;

export function logMessage(
  msgTitle: string,
  msgInfo?: string,
  onlyWarns?: boolean,
): void {
  console.error(
    `${
      onlyWarns ? chalk.yellow(`⚠ ${msgTitle}`) : chalk.red(`❌ ${msgTitle}`)
    }${msgInfo ? `: ${msgInfo}` : ''}`,
  );
}

export function createReportError(
  title: string,
  pkgPathName: string,
): ReportError {
  return function reportError(msgTitle, msgInfo, onlyWarns): void {
    if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk.cyan(`== ${title} in ${pkgPathName} ==`));
      titleDisplayed = title;
      pkgPathDisplayed = pkgPathName;
    }
    logMessage(msgTitle, msgInfo, onlyWarns);

    if (!onlyWarns) {
      // console.trace();
      process.exitCode = 1;
    }
  };
}
