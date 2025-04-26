import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.js";
import { createPackageRule, onlyWarnsForMappingSchema, } from "../create-rule/createPackageRule.js";
const duplicatesSearchInByDependencyType = {
    devDependencies: ["devDependencies", "dependencies"],
    dependencies: ["devDependencies", "dependencies"],
};
export const directDuplicateDependenciesRule = createPackageRule("direct-duplicate-dependencies", {
    type: "object",
    properties: {
        onlyWarnsFor: onlyWarnsForMappingSchema,
    },
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, pkg, reportError, settings, ruleOptions, getDependencyPackageJson, onlyWarnsForMappingCheck, }) => {
        if (node.fieldName === "resolutionsExplained") {
            return;
        }
        const searchIn = duplicatesSearchInByDependencyType[node.fieldName];
        if (!searchIn) {
            return;
        }
        const [depPkg] = getDependencyPackageJson(node.name);
        checkDuplicateDependencies(reportError, pkg, settings.isLibrary ?? false, "dependencies", searchIn, depPkg, onlyWarnsForMappingCheck.createFor(node.name));
    },
});
//# sourceMappingURL=direct-duplicate-dependencies.js.map