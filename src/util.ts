import * as R from "ramda";

/**
 * sum array of numbers
 */
export const sum = R.reduce((tot: number, elem: number) => tot + elem, 0);

/**
 * Set difference
 * @param a
 * @param b
 * @returns
 */
export function setDiff<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
    return new Set(Array.from(a).filter((item) => !b.has(item)));
}

/**
 * Check if given generic array has duplicate elements
 * @param array
 * @returns
 */
export function hasDuplicates(arr: readonly unknown[]): boolean {
    return new Set(arr).size !== arr.length;
}

/**
 * Check if given generic array has distinct elements
 * @param array
 * @returns
 */
export function hasDistinctElems(arr: readonly unknown[]): boolean {
    return new Set(arr).size === arr.length;
}
/**
 * Check if given generic array has at most one value
 * @param array
 * @returns
 */
export function allElemsSame(arr: readonly unknown[]): boolean {
    return arr.length === 0 || new Set(arr).size === 1;
}
