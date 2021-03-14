export const getKeys = <T>(o: T): (keyof T)[] => Object.keys(o) as (keyof T)[];
