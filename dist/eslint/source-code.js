import { TextSourceCodeBase, VisitNodeStep } from "@eslint/plugin-kit";
import { stringifyPkgJson } from "../utils/pkgJsonUtils.js";
export class PackageJsonSourceCode extends TextSourceCodeBase {
    constructor({ text, ast }) {
        super({ text, ast });
    }
    getParent(node) {
        return undefined;
    }
    getAncestors(node) {
        return [];
    }
    traverse() {
        return [
            new VisitNodeStep({
                target: this.ast,
                phase: 1,
                args: [],
            }),
            ...this.ast.children.flatMap((child) => [
                new VisitNodeStep({
                    target: child,
                    phase: 1,
                    args: [],
                }),
                new VisitNodeStep({
                    target: child,
                    phase: 2,
                    args: [],
                }),
            ]),
            new VisitNodeStep({
                target: this.ast,
                phase: 2,
                args: [],
            }),
        ];
    }
    getText(node) {
        if ("type" in node) {
            if (node.type === "Package") {
                return stringifyPkgJson(this.ast.parsedPkgJson.value);
            }
        }
        throw new Error("Invalid node");
    }
    getLoc(node) {
        if ("type" in node) {
            if (node.type === "Package") {
                return { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };
            }
            if (node.type === "DependencyValue") {
                const dependencyValueAst = node;
                const loc = dependencyValueAst.dependencyValue?.locations.all;
                if (!loc)
                    throw new Error("Invalid node");
                return loc;
            }
        }
        throw new Error("Invalid node");
    }
}
//# sourceMappingURL=source-code.js.map