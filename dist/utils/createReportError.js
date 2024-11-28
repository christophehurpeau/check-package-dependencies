/* eslint-disable no-console */
import chalk from "chalk";
import { getEntries } from "./object.js";
let titleDisplayed = null;
let pkgPathDisplayed = null;
let totalWarnings = 0;
let totalErrors = 0;
let totalFixable = 0;
export function displayConclusion() {
    if (!totalWarnings && !totalErrors) {
        console.log(`\n${chalk.green("✅ No errors or warnings found")}.`);
    }
    else if (!totalErrors) {
        console.log(`\nFound ${chalk.yellow(`${totalWarnings} warnings`)}.`);
    }
    else if (!totalWarnings) {
        console.log(`\nFound ${chalk.red(`${totalErrors} errors`)}.`);
    }
    else {
        console.log(`\nFound ${chalk.red(`${totalErrors} errors`)} and ${chalk.yellow(`${totalWarnings} warnings`)}.`);
    }
    if (totalFixable) {
        console.log(`Found ${chalk.green(`${totalFixable} auto-fixable`)} errors or warnings, run the command with "--fix" to fix them.`);
    }
}
export function logMessage(msgTitle, msgInfo, onlyWarns, autoFixable) {
    if (onlyWarns)
        totalWarnings++;
    else
        totalErrors++;
    if (autoFixable)
        totalFixable++;
    console.error(`${onlyWarns ? chalk.yellow(`⚠ ${msgTitle}`) : chalk.red(`❌ ${msgTitle}`)}${msgInfo ? `: ${msgInfo}` : ""}${autoFixable ? ` ${chalk.bgGreenBright(chalk.black("auto-fixable"))}` : ""}`);
}
export function createReportError(title, pkgPathName) {
    return function reportError(msgTitle, msgInfo, onlyWarns, autoFixable = false) {
        if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
            if (titleDisplayed)
                console.error();
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
export function reportNotWarnedFor(reportError, onlyWarnsForCheck) {
    const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
    if (notWarnedFor.length > 0) {
        reportError(`Invalid config in "${onlyWarnsForCheck.configName}"`, `no warning was raised for ${notWarnedFor
            .map((depName) => `"${depName}"`)
            .join(", ")}`, false);
    }
}
export function reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck) {
    const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
    getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
        reportError(`Invalid config in "${onlyWarnsForMappingCheck.configName}" for "${depNameOrStar}"`, `no warning was raised for ${notWarnedFor
            .map((depName) => `"${depName}"`)
            .join(", ")}`);
    });
}
//# sourceMappingURL=createReportError.js.map