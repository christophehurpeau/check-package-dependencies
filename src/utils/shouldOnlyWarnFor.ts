export type OnlyWarnsFor = string[];

export const shouldOnlyWarnFor = (
  dependencyName: string,
  onlyWarnsFor: OnlyWarnsFor,
): boolean => onlyWarnsFor.includes(dependencyName);
