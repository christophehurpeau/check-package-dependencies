import { describe, it } from "node:test";
import { assertNoMessages, assertSingleMessage, createMockReportError, } from "../utils/createReportError.testUtils.js";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.js";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies.js";
describe("checkDuplicateDependencies", () => {
    const { mockReportError, messages } = createMockReportError();
    it("should report error when is in multiple types and not a library", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: { rollup: "1.0.0" },
            dependencies: { rollup: "1.0.0" },
        }, false, "dependencies", ["dependencies", "devDependencies"], {
            name: "some-lib-using-rollup",
            dependencies: { rollup: "^2.0.0" },
        }, createOnlyWarnsForArrayCheck("test", []));
        assertSingleMessage(messages, {
            title: 'Invalid "rollup" present in dependencies and devDependencies',
            info: "please place it only in dependencies",
        });
    });
    it("should report error when is in multiple types with same version and is a library", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: { rollup: "1.0.0" },
            dependencies: { rollup: "1.0.0" },
        }, true, "dependencies", ["dependencies", "devDependencies"], {
            name: "some-lib-using-rollup",
            dependencies: { rollup: "^2.0.0" },
        }, createOnlyWarnsForArrayCheck("test", []));
        assertSingleMessage(messages, {
            title: 'Invalid "rollup" has same version in dependencies and devDependencies',
            info: "please place it only in dependencies or use range in dependencies",
        });
    });
    it("should report error when dependency does not intersect", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: {
                rollup: "1.0.0",
                "some-lib-using-rollup": "1.0.0",
            },
        }, false, "dependencies", ["devDependencies"], {
            name: "some-lib-using-rollup",
            dependencies: { rollup: "^2.0.0" },
        }, createOnlyWarnsForArrayCheck("test", []));
        assertSingleMessage(messages, {
            title: "Invalid duplicate dependency",
            info: '"1.0.0" should satisfies "^2.0.0" from some-lib-using-rollup in dependencies',
            onlyWarns: false,
            dependency: { name: "rollup", origin: "devDependencies" },
        });
    });
    it("should not report error when dev dependency value is a beta", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: {
                rollup: "1.0.0-beta.0",
                "some-lib-using-rollup": "1.0.0",
            },
        }, false, "dependencies", ["devDependencies"], {
            name: "some-lib-using-rollup",
            dependencies: { rollup: "^1.0.0-beta.0" },
        }, createOnlyWarnsForArrayCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when dependency is in onlyWarnsFor", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: {
                rollup: "1.0.0",
                "some-lib-using-rollup": "1.0.0",
            },
        }, false, "dependencies", ["devDependencies"], {
            name: "some-lib-using-rollup",
            dependencies: { rollup: "^2.0.0" },
        }, createOnlyWarnsForArrayCheck("test", ["rollup"]));
        assertSingleMessage(messages, {
            title: "Invalid duplicate dependency",
            info: '"1.0.0" should satisfies "^2.0.0" from some-lib-using-rollup in dependencies',
            onlyWarns: true,
            dependency: { name: "rollup", origin: "devDependencies" },
        });
    });
    it("should not report error when dependency is in peerDependencies", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: {
                rollup: "1.0.0",
                "some-lib-using-rollup": "1.0.0",
            },
        }, false, "peerDependencies", ["devDependencies"], {
            name: "some-lib-using-rollup",
            peerDependencies: { rollup: "^1.0.0" },
        }, createOnlyWarnsForArrayCheck("test", []));
        assertNoMessages(messages);
    });
    it("should report error when dependency is in peerDependencies and allowPeerDependencies is false", () => {
        checkDuplicateDependencies(mockReportError, {
            name: "test",
            devDependencies: {
                rollup: "1.0.0",
                "some-lib-using-rollup": "1.0.0",
            },
        }, true, "peerDependencies", ["devDependencies"], {
            name: "some-lib-using-rollup",
            peerDependencies: { rollup: "^2.0.0" },
        }, createOnlyWarnsForArrayCheck("test", []));
        assertSingleMessage(messages, {
            title: "Invalid duplicate dependency",
            info: '"1.0.0" should satisfies "^2.0.0" from some-lib-using-rollup in peerDependencies',
            onlyWarns: false,
            dependency: { name: "rollup", origin: "devDependencies" },
        });
    });
});
//# sourceMappingURL=checkDuplicateDependencies.test.js.map