import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.js";
import { checkMissingSatisfiesVersions, checkSatisfiesVersion, } from "../../checks/checkSatisfiesVersions.js";
import { createPackageRule } from "../create-rule/createPackageRule.js";
export const satisfiesVersionsRule = createPackageRule("satisfies-versions", {
    type: "object",
    properties: {
        dependencies: {
            type: "object",
            additionalProperties: { type: "string" },
        },
        devDependencies: {
            type: "object",
            additionalProperties: { type: "string" },
        },
        optionalDependencies: {
            type: "object",
            additionalProperties: { type: "string" },
        },
        onlyWarnsFor: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
}, {
    checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
        if (!ruleOptions.dependencies && !ruleOptions.devDependencies) {
            throw new Error('Rule "check-package-dependencies/satisfies-versions" is enabled but no dependencies are configured to check');
        }
        regularDependencyTypes.forEach((type) => {
            if (ruleOptions[type]) {
                checkMissingSatisfiesVersions(reportError, pkg, type, ruleOptions[type], onlyWarnsForCheck);
            }
        });
    },
    checkDependencyValue: ({ node, reportError, ruleOptions, onlyWarnsForCheck, }) => {
        if (!regularDependencyTypes.includes(node.fieldName)) {
            return;
        }
        const fieldName = node.fieldName;
        if (ruleOptions[fieldName]?.[node.name]) {
            const range = ruleOptions[fieldName][node.name];
            if (!range) {
                throw new Error(`Range is undefined for ${node.name} in ${node.fieldName}`);
            }
            checkSatisfiesVersion(reportError, node, range, onlyWarnsForCheck);
        }
    },
});
//# sourceMappingURL=satisfies-version.js.map