import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import checkPackagePlugin from "../src/eslint-plugin.ts";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rulesDocsDir = path.join(rootDir, "documentation", "rules");
const readmePath = path.join(rootDir, "README.md");

const ruleHeaderEndMarker = "<!-- end auto-generated rule header -->";
const rulesListStartMarker = "<!-- begin auto-generated rules list -->";
const rulesListEndMarker = "<!-- end auto-generated rules list -->";

const fixableUrl =
  "https://eslint.org/docs/latest/use/command-line-interface#--fix";
const suggestionsUrl =
  "https://eslint.org/docs/latest/use/core-concepts#rule-suggestions";

const isRuleInConfig = (configName, ruleName) =>
  `check-package-dependencies/${ruleName}` in
  checkPackagePlugin.configs[configName].rules;

const getRules = () =>
  Object.entries(checkPackagePlugin.rules)
    .map(([name, rule]) => ({
      name,
      description: rule.meta.docs.description,
      recommended: rule.meta.docs.recommended,
      recommendedLibrary: isRuleInConfig("recommended-library", name),
      fixable: rule.meta.fixable === "code",
      hasSuggestions: rule.meta.hasSuggestions === true,
    }))
    .toSorted((ruleA, ruleB) => ruleA.name.localeCompare(ruleB.name));

const validateRules = (rules) => {
  const errors = [];

  for (const rule of rules) {
    if (!rule.description) {
      errors.push(`${rule.name}: missing "docs.description"`);
    } else if (rule.description.endsWith(".")) {
      errors.push(`${rule.name}: "docs.description" should not end with a dot`);
    }

    const enabledInRecommended = isRuleInConfig("recommended", rule.name);
    if (rule.recommended !== enabledInRecommended) {
      errors.push(
        `${rule.name}: "docs.recommended" is ${String(rule.recommended)} but the rule is ${enabledInRecommended ? "" : "not "}enabled in the "recommended" config`,
      );
    }
  }

  return errors;
};

const getConfigsSentence = ({ recommended, recommendedLibrary }) => {
  if (recommended && recommendedLibrary) {
    return "💼 This rule is enabled in the ✅ `recommended` and 📚 `recommended-library` configs.";
  }
  if (recommended) {
    return "💼 This rule is enabled in the ✅ `recommended` config.";
  }
  if (recommendedLibrary) {
    return "💼 This rule is enabled in the 📚 `recommended-library` config.";
  }
  return "🚫 This rule is not enabled in any config, it has to be enabled and configured explicitly.";
};

const generateRuleHeader = (rule) => {
  const lines = [`# ${rule.description}`, "", getConfigsSentence(rule), ""];

  if (rule.fixable) {
    lines.push(
      `🔧 This rule is automatically fixable by the [\`--fix\` CLI option](${fixableUrl}).`,
      "",
    );
  }

  if (rule.hasSuggestions) {
    lines.push(
      `💡 This rule is manually fixable by [editor suggestions](${suggestionsUrl}).`,
      "",
    );
  }

  lines.push(ruleHeaderEndMarker, "");

  return lines.join("\n");
};

const generateRuleDocStub = (rule) =>
  `${generateRuleHeader(rule)}
TODO: describe why this rule exists and what it checks.

## Fail

\`\`\`json
{
  "name": "example"
}
\`\`\`

## Pass

\`\`\`json
{
  "name": "example"
}
\`\`\`

## Options

This rule has no options.
`;

const generateRuleDoc = (rule, existingContent) => {
  if (existingContent === undefined) return generateRuleDocStub(rule);

  const markerIndex = existingContent.indexOf(ruleHeaderEndMarker);
  if (markerIndex === -1) {
    throw new Error(
      `documentation/rules/${rule.name}.md is missing the "${ruleHeaderEndMarker}" marker`,
    );
  }

  const body = existingContent.slice(
    markerIndex + ruleHeaderEndMarker.length + 1,
  );
  return generateRuleHeader(rule) + body;
};

const generateRulesList = (rules) => {
  const header = [
    "| Name | Description | 💼 | 🔧 | 💡 |",
    "| :--- | :---------- | :- | :- | :- |",
  ];
  const rows = rules.map((rule) => {
    const configs = [
      rule.recommended ? "✅" : "",
      rule.recommendedLibrary ? "📚" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `| [${rule.name}](documentation/rules/${rule.name}.md) | ${rule.description} | ${configs} | ${rule.fixable ? "🔧" : ""} | ${rule.hasSuggestions ? "💡" : ""} |`;
  });

  return [...header, ...rows].join("\n");
};

const generateReadme = (rules, existingContent) => {
  const startIndex = existingContent.indexOf(rulesListStartMarker);
  const endIndex = existingContent.indexOf(rulesListEndMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(
      `README.md is missing the "${rulesListStartMarker}" / "${rulesListEndMarker}" markers`,
    );
  }

  return `${existingContent.slice(0, startIndex + rulesListStartMarker.length)}\n\n${generateRulesList(rules)}\n\n${existingContent.slice(endIndex)}`;
};

const readFileIfExists = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
};

const oxfmtPath = path.join(rootDir, "node_modules", ".bin", "oxfmt");

const format = (filePath, content) => {
  const result = spawnSync(oxfmtPath, [`--stdin-filepath=${filePath}`], {
    input: content,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `Failed to format ${path.relative(rootDir, filePath)}: ${result.stderr || result.error?.message}`,
    );
  }

  return result.stdout;
};

const generateFiles = (rules) => {
  const files = new Map();

  for (const rule of rules) {
    const filePath = path.join(rulesDocsDir, `${rule.name}.md`);
    files.set(
      filePath,
      format(filePath, generateRuleDoc(rule, readFileIfExists(filePath))),
    );
  }

  files.set(
    readmePath,
    format(
      readmePath,
      generateReadme(rules, fs.readFileSync(readmePath, "utf8")),
    ),
  );

  return files;
};

const getOrphanDocs = (rules) => {
  const ruleNames = new Set(rules.map((rule) => rule.name));
  return fs
    .readdirSync(rulesDocsDir)
    .filter((fileName) => fileName.endsWith(".md"))
    .filter((fileName) => !ruleNames.has(fileName.slice(0, -".md".length)))
    .map((fileName) => path.join(rulesDocsDir, fileName));
};

export const generateRulesDocs = ({ check = false } = {}) => {
  const rules = getRules();
  const errors = validateRules(rules);
  const files = generateFiles(rules);

  for (const orphanPath of getOrphanDocs(rules)) {
    errors.push(
      `${path.relative(rootDir, orphanPath)}: no matching rule, the file should be deleted`,
    );
  }

  const outdatedFiles = [];

  for (const [filePath, content] of files) {
    if (readFileIfExists(filePath) === content) continue;
    outdatedFiles.push(path.relative(rootDir, filePath));
    if (!check) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
    }
  }

  return { errors, outdatedFiles };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const { errors, outdatedFiles } = generateRulesDocs({ check });

  for (const error of errors) {
    console.error(`error: ${error}`);
  }

  if (check) {
    for (const filePath of outdatedFiles) {
      console.error(
        `error: ${filePath} is outdated, run "pnpm run generate:rules-docs"`,
      );
    }
  } else {
    for (const filePath of outdatedFiles) {
      console.log(`updated: ${filePath}`);
    }
  }

  if (errors.length > 0 || (check && outdatedFiles.length > 0)) {
    process.exitCode = 1;
  }
}
