import { Card, ILife, ISequence } from "./types";
/**
 * Check if given generic array has duplicate elements
 * @param array
 * @returns
 */
export declare function hasDuplicates(array: any[]): boolean;
/**
 * sum array of numbers
 */
export declare const sum: (list: readonly number[]) => number;
export declare function cardsInSequence(seq: ISequence | ILife): Card[];
/**
 * Set difference
 * @param a
 * @param b
 * @returns
 */
export declare function setDiff<T>(a: Set<T>, b: Set<T>): Set<T>;
