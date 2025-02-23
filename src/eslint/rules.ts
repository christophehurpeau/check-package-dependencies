import { directDuplicateDependenciesRule } from "./rules/direct-duplicate-dependencies.ts";
import { directPeerDependenciesRule } from "./rules/direct-peer-dependencies.ts";
import { exactVersionsRule } from "./rules/exact-versions.ts";
import { minRangeDependenciesSatisfiesDevDependenciesRule } from "./rules/min-range-dependencies-satisfies-dev-dependencies.ts";
import { minRangePeerDependenciesSatisfiesDependenciesRule } from "./rules/min-range-peer-dependencies-satisfies-dependencies.ts";
import { resolutionsHasExplanationRule } from "./rules/resolutions-has-explanation.ts";
import { resolutionsVersionsMatchRule } from "./rules/resolutions-versions-match.ts";
import { rootWorkspaceShouldNotHaveDependenciesRule } from "./rules/root-workspace-should-not-have-dependencies.ts";
import { satisfiesVersionsRule } from "./rules/satisfies-version.ts";

const rules = {
  ...directPeerDependenciesRule,
  ...directDuplicateDependenciesRule,
  ...exactVersionsRule,
  ...minRangeDependenciesSatisfiesDevDependenciesRule,
  ...minRangePeerDependenciesSatisfiesDependenciesRule,
  ...resolutionsVersionsMatchRule,
  ...satisfiesVersionsRule,
  ...resolutionsHasExplanationRule,
  ...rootWorkspaceShouldNotHaveDependenciesRule,
};

export default rules;
