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
            new VisitNodeStep({
                target: this.ast,
                phase: 2,
                args: [],
            }),
        ];
    }
    getText(node) {
        if ("type" in node && node.type === "Package") {
            return stringifyPkgJson(this.ast.parsedPkgJson.value);
        }
        throw new Error("Invalid node");
    }
}
//# sourceMappingURL=source-code.js.map