"use strict";
// Copied from https://gist.github.com/fasiha/b10461d72c3ea58865daf2b2129143f2
// Made minor type changes
Object.defineProperty(exports, "__esModule", { value: true });
exports.permutations = exports.cartesianProduct = exports.numericCartesianProduct = exports.combinations = exports.numericCombinations = void 0;
/* eslint-disable functional/immutable-data */
/* eslint-disable prefer-const */
/* eslint-disable functional/no-let */
/* eslint-disable functional/no-conditional-statement */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable no-param-reassign */
/* eslint-disable functional/no-loop-statement */
function* range(start, end) {
    for (; start <= end; ++start) {
        yield start;
    }
}
function last(arr) { return arr[arr.length - 1]; }
function* numericCombinations(n, r, loc = []) {
    const idx = loc.length;
    if (idx === r) {
        yield loc;
        return;
    }
    for (let next of range(idx ? last(loc) + 1 : 0, n - r + idx)) {
        yield* numericCombinations(n, r, loc.concat(next));
    }
}
exports.numericCombinations = numericCombinations;
function* combinations(choices, r) {
    for (let idxs of numericCombinations(choices.length, r)) {
        yield idxs.map(i => choices[i]);
    }
}
exports.combinations = combinations;
function* numericCartesianProduct(lenarr) {
    let idx = lenarr.map(_ => 0);
    let carry = 0;
    while (!carry) {
        yield idx;
        carry = 1;
        for (let i = 0; i < lenarr.length; i++) {
            idx[i] += carry;
            if (idx[i] >= lenarr[i]) {
                idx[i] = 0;
                carry = 1;
            }
            else {
                carry = 0;
                break;
            }
        }
    }
}
exports.numericCartesianProduct = numericCartesianProduct;
function* cartesianProduct(...arrs) {
    for (const idx of numericCartesianProduct(arrs.map(v => v.length))) {
        yield idx.map((inner, outer) => arrs[outer][inner]);
    }
}
exports.cartesianProduct = cartesianProduct;
function* permutations(choices, k = choices.length, prefix = []) {
    if (prefix.length === k) {
        yield prefix;
    }
    for (const [i, x] of choices.entries()) {
        yield* permutations(choices.filter((_, j) => j !== i), k, prefix.concat(x));
    }
}
exports.permutations = permutations;
