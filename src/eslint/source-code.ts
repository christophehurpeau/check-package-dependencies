import { TextSourceCodeBase, VisitNodeStep } from "@eslint/plugin-kit";
import type { Location } from "../utils/packageTypes.ts";
import { stringifyPkgJson } from "../utils/pkgJsonUtils.ts";
import type { DependencyValueAst, PackageJsonAst } from "./language.ts";

export class PackageJsonSourceCode extends TextSourceCodeBase {
  declare text: string;
  declare ast: PackageJsonAst;

  constructor({ text, ast }: { text: string; ast: PackageJsonAst }) {
    super({ text, ast });
  }

  override getParent(node: object): object | undefined {
    return undefined;
  }

  override getAncestors(node: object): object[] {
    return [];
  }

  override traverse(): Iterable<VisitNodeStep> {
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

  override getText(node: object): string {
    if ("type" in node) {
      if (node.type === "Package") {
        return stringifyPkgJson(this.ast.parsedPkgJson.value);
      }
    }
    throw new Error("Invalid node");
  }

  override getLoc(node: object): Location {
    if ("type" in node) {
      if (node.type === "Package") {
        return { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };
      }
      if (node.type === "DependencyValue") {
        const dependencyValueAst = node as DependencyValueAst;
        const loc = dependencyValueAst.dependencyValue?.locations.all;
        if (!loc) throw new Error("Invalid node");
        return loc;
      }
    }
    throw new Error("Invalid node");
  }
}
