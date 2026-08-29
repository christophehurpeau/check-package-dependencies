import type { Location } from "../../utils/packageTypes.ts";

/** an error a rule downgraded to a warning through its "onlyWarnsFor" option */
export interface OnlyWarnsForWarning {
  message: string;
  /** the rule that downgraded the error, which is not the rule reporting the warning */
  ruleName: string;
  loc: Location | undefined;
}

/**
 * The warnings collected for a `package.json`, keyed by its ast node so nothing leaks from a
 * file to the next one.
 *
 * A rule cannot report on behalf of another rule: the rules downgrading an error write it here
 * while they visit the package.json, and "report-warns" reports them all on
 * "Package:exit", which the traversal runs after every "Package" and "DependencyValue" visit
 * whatever order eslint happens to run the rules in.
 */
const warningsByPackageAst = new WeakMap<object, OnlyWarnsForWarning[]>();

export function addOnlyWarnsForWarning(
  packageAst: object,
  warning: OnlyWarnsForWarning,
): void {
  const warnings = warningsByPackageAst.get(packageAst);
  if (warnings) {
    warnings.push(warning);
  } else {
    warningsByPackageAst.set(packageAst, [warning]);
  }
}

export function getOnlyWarnsForWarnings(
  packageAst: object,
): readonly OnlyWarnsForWarning[] {
  return warningsByPackageAst.get(packageAst) ?? [];
}
