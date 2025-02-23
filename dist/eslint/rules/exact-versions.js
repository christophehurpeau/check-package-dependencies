import { checkExactVersion } from "../../checks/checkExactVersions.js";
import { createPackageRule, onlyWarnsForArraySchema, } from "../create-rule/createPackageRule.js";
export const exactVersionsRule = createPackageRule("exact-versions", {
    type: "object",
    properties: {
        dependencies: { type: "boolean", default: true },
        devDependencies: { type: "boolean", default: true },
        resolutions: { type: "boolean", default: true },
        onlyWarnsFor: onlyWarnsForArraySchema,
    },
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, reportError, ruleOptions, getDependencyPackageJson, onlyWarnsForCheck, }) => {
        if ([
            ruleOptions.dependencies && "dependencies",
            ruleOptions.devDependencies && "devDependencies",
            ruleOptions.resolutions && "resolutions",
        ]
            .filter(Boolean)
            .includes(node.fieldName)) {
            checkExactVersion(reportError, node, {
                getDependencyPackageJson,
                onlyWarnsForCheck,
            });
        }
    },
});
//# sourceMappingURL=exact-versions.js.map