import * as R from "ramda";
import { Card, ILife, ISequence, NonJokerRank, Rank, Suit } from "./types";

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
export function setDiff<T>(a: Set<T>, b: Set<T>) {
  return new Set(Array.from(a).filter((item) => !b.has(item)));
}

/**
 * Check if given generic array has duplicate elements
 * @param array
 * @returns
 */
export function hasDuplicates(arr: any[]): boolean {
  return new Set(arr).size !== arr.length;
}
