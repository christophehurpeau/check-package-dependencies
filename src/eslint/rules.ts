import { directDuplicateDependenciesRule } from "./rules/direct-duplicate-dependencies.ts";
import { directPeerDependenciesRule } from "./rules/direct-peer-dependencies.ts";
import { exactVersionsRule } from "./rules/exact-versions.ts";
import { identicalVersionsThanDependencyRule } from "./rules/identical-versions-than-dependency.ts";
import { identicalVersionsThanDevDependencyOfDependencyRule } from "./rules/identical-versions-than-dev-dependency-of-dependency.ts";
import { identicalVersionsRule } from "./rules/identical-versions.ts";
import { minRangeDependenciesSatisfiesDevDependenciesRule } from "./rules/min-range-dependencies-satisfies-dev-dependencies.ts";
import { minRangePeerDependenciesSatisfiesDependenciesRule } from "./rules/min-range-peer-dependencies-satisfies-dependencies.ts";
import { resolutionsHasExplanationRule } from "./rules/resolutions-has-explanation.ts";
import { resolutionsVersionsMatchRule } from "./rules/resolutions-versions-match.ts";
import { rootWorkspaceShouldNotHaveDependenciesRule } from "./rules/root-workspace-should-not-have-dependencies.ts";
import { satisfiesVersionsRule } from "./rules/satisfies-version.ts";
import { satisfiesVersionsBetweenDependenciesRule } from "./rules/satisfies-versions-between-dependencies.ts";
import { satisfiesVersionsFromDependenciesRule } from "./rules/satisfies-versions-from-dependencies.ts";
import { satisfiesVersionsFromDevDependenciesOfDependencyRule } from "./rules/satisfies-versions-from-dev-dependencies-of-dependency.ts";
import { satisfiesVersionsInDependencyRule } from "./rules/satisfies-versions-in-dependency.ts";
import { workspaceDependenciesRule } from "./rules/workspace-dependencies.ts";
import { workspaceProtocolRule } from "./rules/workspace-protocol.ts";

const rules = {
  ...directPeerDependenciesRule,
  ...directDuplicateDependenciesRule,
  ...exactVersionsRule,
  ...identicalVersionsRule,
  ...identicalVersionsThanDependencyRule,
  ...identicalVersionsThanDevDependencyOfDependencyRule,
  ...minRangeDependenciesSatisfiesDevDependenciesRule,
  ...minRangePeerDependenciesSatisfiesDependenciesRule,
  ...resolutionsVersionsMatchRule,
  ...satisfiesVersionsRule,
  ...resolutionsHasExplanationRule,
  ...rootWorkspaceShouldNotHaveDependenciesRule,
  ...satisfiesVersionsFromDependenciesRule,
  ...satisfiesVersionsFromDevDependenciesOfDependencyRule,
  ...satisfiesVersionsInDependencyRule,
  ...satisfiesVersionsBetweenDependenciesRule,
  ...workspaceDependenciesRule,
  ...workspaceProtocolRule,
};

export default rules;
