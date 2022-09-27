export const getKeys = <T extends object>(o: T): (keyof T)[] =>
  Object.keys(o) as (keyof T)[];

export const getEntries = <T extends object>(o: T): [keyof T, T[keyof T]][] =>
  Object.entries(o) as unknown as [keyof T, T[keyof T]][];
