export declare function numericCombinations(n: number, r: number, loc?: number[]): IterableIterator<number[]>;
export declare function combinations<T>(choices: readonly T[], r: number): Generator<T[], void, unknown>;
export declare function numericCartesianProduct(lenarr: number[]): Generator<number[]>;
export declare function cartesianProduct<T>(...arrs: T[][]): Generator<T[], void, unknown>;
export declare function permutations<T>(choices: T[], k?: number, prefix?: T[]): Generator<T[]>;
