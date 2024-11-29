import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createOnlyWarnsForArrayCheck,
  createOnlyWarnsForMappingCheck,
} from "./warnForUtils.ts";

describe("createOnlyWarnsForArrayCheck", () => {
  test("configName", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test");
    assert.equal(onlyWarnsForCheck.configName, "test");
  });

  test("undefined", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test");
    assert.deepEqual(onlyWarnsForCheck.getNotWarnedFor(), []);
  });

  test("empty array", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", []);
    assert.deepEqual(onlyWarnsForCheck.getNotWarnedFor(), []);
  });

  test("array with one value", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1"]);
    assert.deepEqual(onlyWarnsForCheck.getNotWarnedFor(), ["1"]);
  });

  test("array with two values", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1", "2"]);
    assert.deepEqual(onlyWarnsForCheck.getNotWarnedFor(), ["1", "2"]);
  });

  test("array with two values with first used", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1", "2"]);
    onlyWarnsForCheck.shouldWarnsFor("1");
    assert.deepEqual(onlyWarnsForCheck.getNotWarnedFor(), ["2"]);
  });

  test("array with two values with all used", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1", "2"]);
    onlyWarnsForCheck.shouldWarnsFor("1");
    onlyWarnsForCheck.shouldWarnsFor("2");
    assert.deepEqual(onlyWarnsForCheck.getNotWarnedFor(), []);
  });
});

describe("createOnlyWarnsForMappingCheck", () => {
  test("configName", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck(
      "test",
      undefined,
    );
    assert.equal(onlyWarnsForMappingCheck.configName, "test");
  });

  test("undefined", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck(
      "test",
      undefined,
    );
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {});
  });

  test("empty array", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", []);
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {});
  });

  test("array with one value", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "1",
    ]);
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      "*": ["1"],
    });
  });

  test("array with two values", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "1",
      "2",
    ]);
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      "*": ["1", "2"],
    });
  });

  test("array with two values with first used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "1",
      "2",
    ]);
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("test");
    onlyWarnsForCheck.shouldWarnsFor("1");
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      "*": ["2"],
    });
  });

  test("array with two values with all used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "1",
      "2",
    ]);
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("test");
    onlyWarnsForCheck.shouldWarnsFor("1");
    onlyWarnsForCheck.shouldWarnsFor("2");
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {});
  });

  test("empty record", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {});
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {});
  });

  test("star record with one value", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1"],
    });
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      "*": ["1"],
    });
  });

  test("star record with two values", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1", "2"],
    });
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      "*": ["1", "2"],
    });
  });

  test("star record with two values with first used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("test");
    onlyWarnsForCheck.shouldWarnsFor("1");
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      "*": ["2"],
    });
  });

  test("star record with two values with all used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("test");
    onlyWarnsForCheck.shouldWarnsFor("1");
    onlyWarnsForCheck.shouldWarnsFor("2");
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {});
  });

  test("record with one value", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1"],
    });
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      dep: ["1"],
    });
  });

  test("record with two values", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      dep: ["1", "2"],
    });
  });

  test("record with two values with first used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("dep");
    onlyWarnsForCheck.shouldWarnsFor("1");
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      dep: ["2"],
    });
  });

  test("record with two values with first not used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("otherDep");
    assert.equal(onlyWarnsForCheck.shouldWarnsFor("1"), false);
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      dep: ["1", "2"],
    });
  });

  test("record with two values with all used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("dep");
    onlyWarnsForCheck.shouldWarnsFor("1");
    onlyWarnsForCheck.shouldWarnsFor("2");
    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {});
  });

  test("complex record", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2", "a", "b", "c"],
      otherDep: ["3", "4", "a", "b"],
      test: ["5", "6", "a", "b"],
      "*": ["7", "8", "c"],
    });
    const onlyWarnsForCheckDep = onlyWarnsForMappingCheck.createFor("dep");
    assert.equal(onlyWarnsForCheckDep.shouldWarnsFor("1"), true);
    assert.equal(onlyWarnsForCheckDep.shouldWarnsFor("8"), true);
    assert.equal(onlyWarnsForCheckDep.shouldWarnsFor("a"), true);
    assert.equal(onlyWarnsForCheckDep.shouldWarnsFor("c"), true);

    const onlyWarnsForCheckOtherDep =
      onlyWarnsForMappingCheck.createFor("otherDep");
    assert.equal(onlyWarnsForCheckOtherDep.shouldWarnsFor("1"), false);
    assert.equal(onlyWarnsForCheckOtherDep.shouldWarnsFor("3"), true);
    assert.equal(onlyWarnsForCheckOtherDep.shouldWarnsFor("4"), true);
    assert.equal(onlyWarnsForCheckOtherDep.shouldWarnsFor("8"), true);
    assert.equal(onlyWarnsForCheckOtherDep.shouldWarnsFor("a"), true);
    assert.equal(onlyWarnsForCheckOtherDep.shouldWarnsFor("b"), true);

    assert.deepEqual(onlyWarnsForMappingCheck.getNotWarnedFor(), {
      dep: ["2", "b", "c"],
      test: ["5", "6", "a", "b"],
      "*": ["7"],
    });
  });
});
