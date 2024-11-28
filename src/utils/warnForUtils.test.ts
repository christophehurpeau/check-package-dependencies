import { describe, expect, test } from "vitest";
import {
  createOnlyWarnsForArrayCheck,
  createOnlyWarnsForMappingCheck,
} from "./warnForUtils.ts";

describe("createOnlyWarnsForArrayCheck", () => {
  test("configName", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test");
    expect(onlyWarnsForCheck.configName).toBe("test");
  });
  test("undefined", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test");
    expect(onlyWarnsForCheck.getNotWarnedFor()).toStrictEqual([]);
  });

  test("empty array", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", []);
    expect(onlyWarnsForCheck.getNotWarnedFor()).toStrictEqual([]);
  });

  test("array with one value", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1"]);
    expect(onlyWarnsForCheck.getNotWarnedFor()).toStrictEqual(["1"]);
  });

  test("array with two values", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1", "2"]);
    expect(onlyWarnsForCheck.getNotWarnedFor()).toStrictEqual(["1", "2"]);
  });

  test("array with two values with first used", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1", "2"]);
    onlyWarnsForCheck.shouldWarnsFor("1");
    expect(onlyWarnsForCheck.getNotWarnedFor()).toStrictEqual(["2"]);
  });

  test("array with two values with all used", () => {
    const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("test", ["1", "2"]);
    onlyWarnsForCheck.shouldWarnsFor("1");
    onlyWarnsForCheck.shouldWarnsFor("2");
    expect(onlyWarnsForCheck.getNotWarnedFor()).toStrictEqual([]);
  });
});
describe("createOnlyWarnsForMappingCheck", () => {
  test("configName", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck(
      "test",
      undefined,
    );
    expect(onlyWarnsForMappingCheck.configName).toBe("test");
  });

  test("undefined", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck(
      "test",
      undefined,
    );
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({});
  });

  test("empty array", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", []);
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({});
  });

  test("array with one value", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "1",
    ]);
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      "*": ["1"],
    });
  });

  test("array with two values", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "1",
      "2",
    ]);
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
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
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
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
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({});
  });

  test("empty record", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {});
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({});
  });

  test("star record with one value", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1"],
    });
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      "*": ["1"],
    });
  });

  test("star record with two values", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1", "2"],
    });
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      "*": ["1", "2"],
    });
  });

  test("star record with two values with first used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("test");
    onlyWarnsForCheck.shouldWarnsFor("1");
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
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
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({});
  });

  test("record with one value", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1"],
    });
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      dep: ["1"],
    });
  });

  test("record with two values", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      dep: ["1", "2"],
    });
  });

  test("record with two values with first used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("dep");
    onlyWarnsForCheck.shouldWarnsFor("1");
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      dep: ["2"],
    });
  });

  test("record with two values with first not used", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2"],
    });
    const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor("otherDep");
    expect(onlyWarnsForCheck.shouldWarnsFor("1")).toBe(false);
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
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
    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({});
  });

  test("complex record", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      dep: ["1", "2", "a", "b", "c"],
      otherDep: ["3", "4", "a", "b"],
      test: ["5", "6", "a", "b"],
      "*": ["7", "8", "c"],
    });
    const onlyWarnsForCheckDep = onlyWarnsForMappingCheck.createFor("dep");
    expect(onlyWarnsForCheckDep.shouldWarnsFor("1")).toBe(true);
    expect(onlyWarnsForCheckDep.shouldWarnsFor("8")).toBe(true);
    expect(onlyWarnsForCheckDep.shouldWarnsFor("a")).toBe(true);
    expect(onlyWarnsForCheckDep.shouldWarnsFor("c")).toBe(true);

    const onlyWarnsForCheckOtherDep =
      onlyWarnsForMappingCheck.createFor("otherDep");
    expect(onlyWarnsForCheckOtherDep.shouldWarnsFor("1")).toBe(false);
    expect(onlyWarnsForCheckOtherDep.shouldWarnsFor("3")).toBe(true);
    expect(onlyWarnsForCheckOtherDep.shouldWarnsFor("4")).toBe(true);
    expect(onlyWarnsForCheckOtherDep.shouldWarnsFor("8")).toBe(true);
    expect(onlyWarnsForCheckOtherDep.shouldWarnsFor("a")).toBe(true);
    expect(onlyWarnsForCheckOtherDep.shouldWarnsFor("b")).toBe(true);

    expect(onlyWarnsForMappingCheck.getNotWarnedFor()).toStrictEqual({
      dep: ["2", "b", "c"],
      test: ["5", "6", "a", "b"],
      "*": ["7"],
    });
  });
});
