/**
 * sum array of numbers
 */
export declare const sum: (list: readonly number[]) => number;
/**
 * Set difference
 * @param a
 * @param b
 * @returns
 */
export declare function setDiff<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T>;
/**
 * Check if given generic array has duplicate elements
 * @param array
 * @returns
 */
export declare function hasDuplicates(arr: readonly unknown[]): boolean;
/**
 * Check if given generic array has distinct elements
 * @param array
 * @returns
 */
export declare function hasDistinctElems(arr: readonly unknown[]): boolean;
/**
 * Check if given generic array has at most one value
 * @param array
 * @returns
 */
export declare function allElemsSame(arr: readonly unknown[]): boolean;
