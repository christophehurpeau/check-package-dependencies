import { dirname } from "node:path";
import { createGetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.js";
import { parsePkg } from "../utils/pkgJsonUtils.js";
import { PackageJsonSourceCode } from "./source-code.js";
export const PackageJSONLanguage = {
    fileType: "text",
    lineStart: 1,
    columnStart: 1,
    nodeTypeKey: "type",
    visitorKeys: {
        Package: ["DependencyValue"],
        DependencyValue: [],
    },
    validateLanguageOptions(languageOptions) { },
    parse(file, context) {
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
                    children: [
                        "dependencies",
                        "devDependencies",
                        "optionalDependencies",
                        "peerDependencies",
                        "resolutions",
                    ].flatMap((dependencyType) => {
                        return Object.values(parsedPkgJson[dependencyType] ?? {}).map((dependencyValue) => {
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
                        });
                    }),
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
        if (typeof file.body !== "string") {
            throw new TypeError("File body is not a string");
        }
        return new PackageJsonSourceCode({
            text: file.body,
            ast: parseResult.ast,
        });
    },
};
//# sourceMappingURL=language.js.map