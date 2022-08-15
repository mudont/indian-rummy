// Copied from https://gist.github.com/fasiha/b10461d72c3ea58865daf2b2129143f2
// Made minor type changes

/* eslint-disable functional/immutable-data */
/* eslint-disable prefer-const */
/* eslint-disable functional/no-let */
/* eslint-disable functional/no-conditional-statement */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable no-param-reassign */
/* eslint-disable functional/no-loop-statement */
function* range(start: number, end: number) {
    for (; start <= end; ++start) { yield start; }
}
function last<T>(arr: T[]) { return arr[arr.length - 1]; }
export function* numericCombinations(n: number, r: number, loc: number[] = []): IterableIterator<number[]> {
    const idx = loc.length;
    if (idx === r) {
        yield loc;
        return;
    }
    for (let next of range(idx ? last(loc) + 1 : 0, n - r + idx)) { yield* numericCombinations(n, r, loc.concat(next)); }
}
export function* combinations<T>(choices: readonly T[], r: number) {
    for (let idxs of numericCombinations(choices.length, r)) { yield idxs.map(i => choices[i]); }
}

export function* numericCartesianProduct(lenarr: number[]): Generator<number[]> {
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
            } else {
                carry = 0;
                break;
            }
        }
    }
}

export function* cartesianProduct<T>(...arrs: T[][]) {
    for (const idx of numericCartesianProduct(arrs.map(v => v.length))) {
        yield idx.map((inner, outer) => arrs[outer][inner]);
    }
}

export function* permutations<T>(choices: T[], k = choices.length, prefix = [] as T[]): Generator<T[]> {
    if (prefix.length === k) { yield prefix; }
    for (const [i, x] of choices.entries()) {
        yield* permutations(choices.filter((_, j) => j !== i), k, prefix.concat(x));
    }
}
