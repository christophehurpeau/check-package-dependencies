import { checkDirectPeerDependencies } from "../../checks/checkDirectPeerDependencies.js";
import { createOnlyWarnsForMappingCheck } from "../../utils/warnForUtils.js";
import { createPackageRule, onlyWarnsForMappingSchema, } from "../create-rule/createPackageRule.js";
export const directPeerDependenciesRule = createPackageRule("direct-peer-dependencies", {
    type: "object",
    properties: {
        onlyWarnsFor: onlyWarnsForMappingSchema,
        onlyWarnsForMissing: onlyWarnsForMappingSchema,
    },
    additionalProperties: false,
}, {
    checkPackage: ({ pkg, reportError, settings, ruleOptions, getDependencyPackageJson, onlyWarnsForMappingCheck: invalidOnlyWarnsForCheck, checkOnlyWarnsForMapping, }) => {
        const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck("onlyWarnsForMissing", ruleOptions.onlyWarnsForMissing);
        checkDirectPeerDependencies(reportError, settings.isLibrary ?? false, pkg, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck);
        checkOnlyWarnsForMapping(missingOnlyWarnsForCheck);
    },
});
//# sourceMappingURL=direct-peer-dependencies.js.map