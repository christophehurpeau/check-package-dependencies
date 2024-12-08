import { describe, it } from "node:test";
import { assertCreateReportErrorCall, assertNoMessages, assertSingleMessage, createMockReportError, } from "../utils/createReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { checkNoDependencies } from "./checkNoDependencies.js";
describe("checkNoDependencies", () => {
    const { createReportError, messages } = createMockReportError();
    it('should return no error when no "dependencies" is present', () => {
        checkNoDependencies(parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }), undefined, undefined, createReportError);
        assertNoMessages(messages);
    });
    it('should return no error when no "devDependencies" is present', () => {
        checkNoDependencies(parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }), "devDependencies", undefined, createReportError);
        assertNoMessages(messages);
    });
    it('should return no error when "dependencies" is present', () => {
        checkNoDependencies(parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }), undefined, undefined, createReportError);
        assertCreateReportErrorCall(createReportError, "No dependencies");
        assertSingleMessage(messages, {
            errorMessage: "Unexpected dependencies",
            errorDetails: "you should move them in devDependencies",
            autoFixable: false,
        });
    });
    it('should return no error when "dependencies" is present and is in onlyWarnsFor', () => {
        checkNoDependencies(parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }), "dependencies", "peerDependencies", createReportError);
        assertCreateReportErrorCall(createReportError, "No dependencies");
        assertSingleMessage(messages, {
            errorMessage: "Unexpected dependencies",
            errorDetails: "you should move them in peerDependencies",
            autoFixable: false,
        });
    });
});
//# sourceMappingURL=checkNoDependencies.test.js.map