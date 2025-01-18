import { TextSourceCodeBase, VisitNodeStep } from "@eslint/plugin-kit";
import type { PackageJsonAst } from "./language.ts";
export declare class PackageJsonSourceCode extends TextSourceCodeBase {
    text: string;
    ast: PackageJsonAst;
    constructor({ text, ast }: {
        text: string;
        ast: PackageJsonAst;
    });
    getParent(node: object): object | undefined;
    getAncestors(node: object): object[];
    traverse(): Iterable<VisitNodeStep>;
    getText(node: object): string;
}
//# sourceMappingURL=source-code.d.ts.map