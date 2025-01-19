import { dirname } from "node:path";
import type {
  File,
  Language,
  LanguageContext,
  LanguageOptions,
  OkParseResult,
  ParseResult,
} from "@eslint/core";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createGetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type {
  DependencyTypes,
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { parsePkg } from "../utils/pkgJsonUtils.ts";
import { PackageJsonSourceCode } from "./source-code.ts";

export interface PackageJsonAst {
  type: "Package";
  parsedPkgJson: ParsedPackageJson;
  getDependencyPackageJson: GetDependencyPackageJson;
  loc: { line: number; column: number };
  range: [number, number];
  children: DependencyValueAst[];
  value: string;
}

export interface DependencyValueAst {
  type: "DependencyValue";
  dependencyType: DependencyTypes;
  parsedPkgJson: ParsedPackageJson;
  getDependencyPackageJson: GetDependencyPackageJson;
  dependencyValue: DependencyValue | undefined;
  loc: { line: number; column: number };
  range: [number, number];
  value: string;
}

export const PackageJSONLanguage: Language = {
  fileType: "text",
  lineStart: 1,
  columnStart: 1,
  nodeTypeKey: "type",
  visitorKeys: { Package: ["DependencyValue"], DependencyValue: [] },

  validateLanguageOptions(languageOptions: LanguageOptions): void {},

  parse(
    file: File,
    context: LanguageContext<LanguageOptions>,
  ): ParseResult<PackageJsonAst> {
    if (typeof file.body !== "string") {
      throw new TypeError("File body is not a string");
    }

    try {
      const parsedPkgJson = parsePkg(file.body, file.path);
      const getDependencyPackageJson = createGetDependencyPackageJson({
        pkgDirname: dirname(file.path),
      });

      return {
        ok: true,
        ast: {
          type: "Package",
          parsedPkgJson,
          getDependencyPackageJson,
          loc: { line: 1, column: 1 },
          value: file.body,
          range: [0, file.body.length],
          children: (
            [
              "dependencies",
              "devDependencies",
              "optionalDependencies",
              "peerDependencies",
              "resolutions",
            ] as const
          ).flatMap((dependencyType): DependencyValueAst[] => {
            return Object.values(parsedPkgJson[dependencyType] ?? {}).map(
              (dependencyValue) => {
                return {
                  type: "DependencyValue",
                  dependencyType,
                  parsedPkgJson,
                  getDependencyPackageJson,
                  dependencyValue,
                  loc: dependencyValue.locations.all.start,
                  range: dependencyValue.ranges.all,
                  value: dependencyValue.toString(),
                };
              },
            );
          }),
        },
      };
    } catch (error) {
      return {
        ok: false,
        errors: [
          {
            line: 1,
            column: 1,
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  },

  createSourceCode(
    file: File,
    parseResult: OkParseResult<PackageJsonAst>,
    context: LanguageContext<LanguageOptions>,
  ): PackageJsonSourceCode {
    if (typeof file.body !== "string") {
      throw new TypeError("File body is not a string");
    }

    return new PackageJsonSourceCode({
      text: file.body,
      ast: parseResult.ast,
    });
  },
};
