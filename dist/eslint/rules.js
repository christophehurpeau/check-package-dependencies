import { directDuplicateDependenciesRule } from "./rules/direct-duplicate-dependencies.js";
import { directPeerDependenciesRule } from "./rules/direct-peer-dependencies.js";
import { exactVersionsRule } from "./rules/exact-versions.js";
import { minRangeDependenciesSatisfiesDevDependenciesRule } from "./rules/min-range-dependencies-satisfies-dev-dependencies.js";
import { minRangePeerDependenciesSatisfiesDependenciesRule } from "./rules/min-range-peer-dependencies-satisfies-dependencies.js";
import { resolutionsHasExplanationRule } from "./rules/resolutions-has-explanation.js";
import { resolutionsVersionsMatchRule } from "./rules/resolutions-versions-match.js";
import { rootWorkspaceShouldNotHaveDependenciesRule } from "./rules/root-workspace-should-not-have-dependencies.js";
import { satisfiesVersionsRule } from "./rules/satisfies-version.js";
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
//# sourceMappingURL=rules.js.map