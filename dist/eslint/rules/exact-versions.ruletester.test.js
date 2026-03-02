import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.js";
import { exactVersionsRule } from "./exact-versions.js";
const tester = new RuleTester({
    plugins: checkPackagePlugin.configs.recommended.plugins,
    language: "check-package-dependencies/package-json",
});
tester.run("exact-versions", exactVersionsRule["exact-versions"], {
    valid: [
        {
            code: `${JSON.stringify({ name: "test", devDependencies: { dep: "1.0.0" } }, null, 2)}\n`,
            filename: "/tmp/package.json",
            options: [
                { dependencies: true, devDependencies: true, resolutions: true },
            ],
        },
    ],
    invalid: [
        {
            code: `${JSON.stringify({ name: "test", devDependencies: { dep: "^1.0.0" } }, null, 2)}\n`,
            filename: "/tmp/package.json",
            options: [
                { dependencies: true, devDependencies: true, resolutions: true },
            ],
            errors: [{ message: /Unexpected range value/ }],
        },
    ],
});
//# sourceMappingURL=exact-versions.ruletester.test.js.map