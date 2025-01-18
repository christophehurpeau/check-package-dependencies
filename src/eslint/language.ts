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
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
import { parsePkg } from "../utils/pkgJsonUtils.ts";
import { PackageJsonSourceCode } from "./source-code.ts";

export interface PackageJsonAst {
  type: "Package";
  parsedPkgJson: ParsedPackageJson;
  getDependencyPackageJson: GetDependencyPackageJson;
  loc: { line: number; column: number };
}

export const PackageJSONLanguage: Language = {
  fileType: "text",
  lineStart: 1,
  columnStart: 1,
  nodeTypeKey: "type",
  visitorKeys: { Package: [] },

  validateLanguageOptions(languageOptions: LanguageOptions): void {},

  parse(
    file: File,
    context: LanguageContext<LanguageOptions>,
  ): ParseResult<PackageJsonAst> {
    try {
      const body =
        typeof file.body === "string"
          ? file.body
          : new TextDecoder().decode(file.body);
      const parsedPkgJson = parsePkg(body, file.path);
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
    return new PackageJsonSourceCode({
      text:
        typeof file.body === "string"
          ? file.body
          : new TextDecoder().decode(file.body),
      ast: parseResult.ast,
    });
  },
};
