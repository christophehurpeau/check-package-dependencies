import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.js";
import { createPackageRule, onlyWarnsForMappingSchema, } from "../create-rule/createPackageRule.js";
export const directDuplicateDependenciesRule = createPackageRule("direct-duplicate-dependencies", {
    type: "object",
    properties: {
        onlyWarnsFor: onlyWarnsForMappingSchema,
    },
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, pkg, reportError, settings, ruleOptions, getDependencyPackageJson, onlyWarnsForMappingCheck, }) => {
        const searchInByDependencyType = {
            devDependencies: ["devDependencies", "dependencies"],
            dependencies: ["devDependencies", "dependencies"],
        };
        if (node.fieldName === "resolutionsExplained") {
            return;
        }
        const searchIn = searchInByDependencyType[node.fieldName];
        if (!searchIn) {
            return;
        }
        const [depPkg] = getDependencyPackageJson(node.name);
        checkDuplicateDependencies(reportError, pkg, settings.isLibrary ?? false, "dependencies", searchIn, depPkg, onlyWarnsForMappingCheck.createFor(node.name));
    },
});
//# sourceMappingURL=direct-duplicate-dependencies.js.map