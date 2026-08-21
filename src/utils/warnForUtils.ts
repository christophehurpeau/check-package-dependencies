import type { Commented } from "./comments.ts";
import { getEntries } from "./object.ts";

/** a dependency name to only warn for, optionally with the reason the exception exists */
export type OnlyWarnsForEntry = string | (Commented & { name: string });
export type OnlyWarnsFor = OnlyWarnsForEntry[];
export type OnlyWarnsForDependencyMapping = Record<
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  string | "*",
  OnlyWarnsFor | undefined
>;
export type OnlyWarnsForOptionalDependencyMapping =
  | OnlyWarnsFor
  | OnlyWarnsForDependencyMapping
  | undefined;

export interface OnlyWarnsForCheck {
  configName: string;
  getNotWarnedFor: () => string[];
  getCommentFor: (dependencyName: string) => string | undefined;
  shouldWarnsFor: (dependencyName: string) => boolean;
}

export interface OnlyWarnsForMappingCheck {
  configName: string;
  getNotWarnedFor: () => Record<string, string[]>;
  createFor: (dependencyName: string) => OnlyWarnsForCheck;
}

const commentByDependencyName = (
  onlyWarnsFor: OnlyWarnsFor,
): Map<string, string | undefined> =>
  new Map(
    onlyWarnsFor.map((entry) =>
      typeof entry === "string"
        ? [entry, undefined]
        : [entry.name, entry.comment],
    ),
  );

export const createOnlyWarnsForArrayCheck = (
  configName: string,
  onlyWarnsFor: OnlyWarnsFor = [],
): OnlyWarnsForCheck => {
  const comments = commentByDependencyName(onlyWarnsFor);
  const notWarnedFor = new Set(comments.keys());
  return {
    configName,
    getNotWarnedFor: () => [...notWarnedFor],
    getCommentFor: (dependencyName) => comments.get(dependencyName),
    shouldWarnsFor(dependencyName) {
      if (comments.has(dependencyName)) {
        notWarnedFor.delete(dependencyName);
        return true;
      }
      return false;
    },
  };
};

const isMapping = (
  onlyWarnsFor: OnlyWarnsForOptionalDependencyMapping,
): onlyWarnsFor is OnlyWarnsForDependencyMapping => {
  return typeof onlyWarnsFor === "object" && !Array.isArray(onlyWarnsFor);
};

export const createOnlyWarnsForMappingCheck = (
  configName: string,
  onlyWarnsFor: OnlyWarnsForOptionalDependencyMapping,
): OnlyWarnsForMappingCheck => {
  if (isMapping(onlyWarnsFor)) {
    const comments = new Map(
      getEntries(onlyWarnsFor).map(([entryKey, entryValue]) => [
        entryKey,
        commentByDependencyName(entryValue ?? []),
      ]),
    );
    const notWarnedFor = new Map(
      [...comments].map(([entryKey, entryComments]) => [
        entryKey,
        new Set(entryComments.keys()),
      ]),
    );
    return {
      configName,
      getNotWarnedFor: () =>
        Object.fromEntries(
          [...notWarnedFor]
            .filter(([, set]) => set.size > 0)
            .map(([key, set]) => [key, [...set]]),
        ),
      createFor(dependencyNameLevel1) {
        return {
          configName,
          getNotWarnedFor() {
            throw new Error("Invalid call to getNotWarnedFor()");
          },
          // the more specific entry explains the exception better than the "*" one
          getCommentFor: (dependencyName) =>
            comments.get(dependencyNameLevel1)?.get(dependencyName) ??
            comments.get("*")?.get(dependencyName),
          shouldWarnsFor(dependencyName) {
            if (comments.get("*")?.has(dependencyName)) {
              notWarnedFor.get("*")?.delete(dependencyName);
              return true;
            }
            if (comments.get(dependencyNameLevel1)?.has(dependencyName)) {
              notWarnedFor.get(dependencyNameLevel1)?.delete(dependencyName);
              return true;
            }
            return false;
          },
        };
      },
    };
  }

  const arrayOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
    configName,
    onlyWarnsFor,
  );
  return {
    configName,
    getNotWarnedFor: (): Record<string, string[]> => {
      const notWarnedFor = arrayOnlyWarnsForCheck.getNotWarnedFor();
      if (notWarnedFor.length > 0) {
        return { "*": notWarnedFor };
      }
      return {};
    },
    createFor() {
      return {
        configName,
        getNotWarnedFor() {
          throw new Error("Invalid call to getNotWarnedFor()");
        },
        getCommentFor: (dependencyName) =>
          arrayOnlyWarnsForCheck.getCommentFor(dependencyName),
        shouldWarnsFor(dependencyName) {
          return arrayOnlyWarnsForCheck.shouldWarnsFor(dependencyName);
        },
      };
    },
  };
};

/**
 * The "onlyWarns" and "comment" details of an error downgraded to a warning by
 * "onlyWarnsFor", the comment being the explanation of the matched entry.
 */
export const warnDetails = (
  onlyWarnsForCheck: OnlyWarnsForCheck | undefined,
  dependencyName: string,
): Commented & { onlyWarns: boolean | undefined } => {
  const onlyWarns = onlyWarnsForCheck?.shouldWarnsFor(dependencyName);
  const comment = onlyWarns
    ? onlyWarnsForCheck?.getCommentFor(dependencyName)
    : undefined;
  return comment === undefined ? { onlyWarns } : { onlyWarns, comment };
};
