/* eslint-disable no-console */
import chalk from "chalk";
import { getEntries } from "./object.js";
const pathMessages = new Map();
let totalWarnings = 0;
let totalErrors = 0;
let totalFixable = 0;
export function logMessage(message) {
    const { title, info, onlyWarns, autoFixable } = message;
    if (onlyWarns)
        totalWarnings++;
    else
        totalErrors++;
    if (autoFixable)
        totalFixable++;
    console.error(`${onlyWarns ? chalk.yellow(`⚠ ${title}`) : chalk.red(`❌ ${title}`)}${info ? `: ${info}` : ""}${autoFixable ? ` ${chalk.bgGreenBright(chalk.black("auto-fixable"))}` : ""}`);
}
function displayMessagesForPath(path, { generalMessages, dependencyGroups, }) {
    console.error(chalk.cyan(`== ${path} ==`));
    // Display general messages first
    if (generalMessages.length > 0) {
        const title = generalMessages[0].title;
        console.error(chalk.cyan(title));
        for (const message of generalMessages) {
            logMessage(message);
        }
    }
    // Then display dependency groups
    for (const [dependency, group] of dependencyGroups) {
        if (generalMessages.length > 0)
            console.error();
        console.error(chalk.cyan(`Issues for ${dependency} in ${path}:`));
        for (const message of group.messages) {
            logMessage(message);
        }
    }
}
function displayConclusion() {
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
export function displayMessages() {
    // Display all collected messages
    for (const [path, pathData] of pathMessages) {
        displayMessagesForPath(path, pathData);
    }
    displayConclusion();
}
export function createReportError(title, pkgPathName) {
    return function reportError(message) {
        let pathData = pathMessages.get(pkgPathName);
        if (!pathData) {
            pathData = {
                generalMessages: [],
                dependencyGroups: new Map(),
            };
            pathMessages.set(pkgPathName, pathData);
        }
        if (message.dependency) {
            const dependencyKey = `${message.dependency.origin ? `${message.dependency.origin} : ` : ""}${message.dependency.name}`;
            let group = pathData.dependencyGroups.get(dependencyKey);
            if (!group) {
                group = { messages: [] };
                pathData.dependencyGroups.set(dependencyKey, group);
            }
            group.messages.push({ ...message, title });
        }
        else {
            pathData.generalMessages.push({ ...message, title });
        }
        if (!message.onlyWarns) {
            process.exitCode = 1;
        }
    };
}
export function reportNotWarnedFor(reportError, onlyWarnsForCheck) {
    const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
    if (notWarnedFor.length > 0) {
        reportError({
            title: `Invalid config in "${onlyWarnsForCheck.configName}"`,
            info: `no warning was raised for ${notWarnedFor
                .map((depName) => `"${depName}"`)
                .join(", ")}`,
        });
    }
}
export function reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck) {
    const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
    getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
        reportError({
            title: `Invalid config in "${onlyWarnsForMappingCheck.configName}"`,
            info: `no warning was raised for ${notWarnedFor
                .map((depName) => `"${depName}"`)
                .join(", ")}`,
            dependency: { name: depNameOrStar },
        });
    });
}
export function resetMessages() {
    pathMessages.clear();
    totalWarnings = 0;
    totalErrors = 0;
    totalFixable = 0;
}
//# sourceMappingURL=createReportError.js.map