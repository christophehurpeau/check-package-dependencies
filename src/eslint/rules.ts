import { consistentWorkspaceDependenciesRule } from "./rules/consistent-workspace-dependencies.ts";
import { minRangeDependenciesSatisfiesDevDependenciesRule } from "./rules/min-range-dependencies-satisfies-dev-dependencies.ts";
import { minRangePeerDependenciesSatisfiesDependenciesRule } from "./rules/min-range-peer-dependencies-satisfies-dependencies.ts";
import { noDirectDuplicateDependenciesRule } from "./rules/no-direct-duplicate-dependencies.ts";
import { noRootWorkspaceDependenciesRule } from "./rules/no-root-workspace-dependencies.ts";
import { requireDirectPeerDependenciesRule } from "./rules/require-direct-peer-dependencies.ts";
import { requireExactVersionsRule } from "./rules/require-exact-versions.ts";
import { requireIdenticalVersionsAsDependencyRule } from "./rules/require-identical-versions-as-dependency.ts";
import { requireIdenticalVersionsAsDevDependencyOfDependencyRule } from "./rules/require-identical-versions-as-dev-dependency-of-dependency.ts";
import { requireIdenticalVersionsRule } from "./rules/require-identical-versions.ts";
import { requireResolutionsExplanationRule } from "./rules/require-resolutions-explanation.ts";
import { requireWorkspaceProtocolRule } from "./rules/require-workspace-protocol.ts";
import { resolutionsVersionsMatchRule } from "./rules/resolutions-versions-match.ts";
import { satisfiesVersionsBetweenDependenciesRule } from "./rules/satisfies-versions-between-dependencies.ts";
import { satisfiesVersionsFromDependenciesRule } from "./rules/satisfies-versions-from-dependencies.ts";
import { satisfiesVersionsFromDevDependenciesOfDependencyRule } from "./rules/satisfies-versions-from-dev-dependencies-of-dependency.ts";
import { satisfiesVersionsInDependencyRule } from "./rules/satisfies-versions-in-dependency.ts";
import { satisfiesVersionsRule } from "./rules/satisfies-versions.ts";

const rules = {
  ...requireDirectPeerDependenciesRule,
  ...noDirectDuplicateDependenciesRule,
  ...requireExactVersionsRule,
  ...requireIdenticalVersionsRule,
  ...requireIdenticalVersionsAsDependencyRule,
  ...requireIdenticalVersionsAsDevDependencyOfDependencyRule,
  ...minRangeDependenciesSatisfiesDevDependenciesRule,
  ...minRangePeerDependenciesSatisfiesDependenciesRule,
  ...resolutionsVersionsMatchRule,
  ...satisfiesVersionsRule,
  ...requireResolutionsExplanationRule,
  ...noRootWorkspaceDependenciesRule,
  ...satisfiesVersionsFromDependenciesRule,
  ...satisfiesVersionsFromDevDependenciesOfDependencyRule,
  ...satisfiesVersionsInDependencyRule,
  ...satisfiesVersionsBetweenDependenciesRule,
  ...consistentWorkspaceDependenciesRule,
  ...requireWorkspaceProtocolRule,
};

export default rules;
