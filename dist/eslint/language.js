import { dirname } from "node:path";
import { createGetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.js";
import { parsePkg } from "../utils/pkgJsonUtils.js";
import { PackageJsonSourceCode } from "./source-code.js";
export const PackageJSONLanguage = {
    fileType: "text",
    lineStart: 1,
    columnStart: 1,
    nodeTypeKey: "type",
    visitorKeys: { Package: [] },
    validateLanguageOptions(languageOptions) { },
    parse(file, context) {
        try {
            const body = typeof file.body === "string"
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
        }
        catch (error) {
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
    createSourceCode(file, parseResult, context) {
        return new PackageJsonSourceCode({
            text: typeof file.body === "string"
                ? file.body
                : new TextDecoder().decode(file.body),
            ast: parseResult.ast,
        });
    },
};
//# sourceMappingURL=language.js.map