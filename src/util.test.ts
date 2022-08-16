/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
import * as util from "./util";

test("sum([1,2] equals 3", () => {
    expect(util.sum([1, 2])).toBe(3);
});

test("Empty arry sums to 0", () => {
    expect(util.sum([])).toBe(0);
});

test("Set diff typical", () => {
    expect(util.setDiff(new Set([1, 2, 3]), new Set([3, 4]))).toStrictEqual(
        new Set([1, 2])
    );
});

test("Set diff empty", () => {
    expect(
        util.setDiff(new Set([1, 2, 3]), new Set([1, 2, 3, 5, 4]))
    ).toStrictEqual(new Set([]));
});

test("[1,2,3] has no dups", () => {
    expect(util.hasDuplicates([1, 2, 3])).toBe(false);
});
test("[1,2,3] has distinct elems", () => {
    expect(util.hasDistinctElems([1, 2, 3])).toBe(true);
});
test("[1,2,2] doesn't have distinct elems", () => {
    expect(util.hasDistinctElems([1, 2, 2])).toBe(false);
});

test("[1,1,1] has same elem", () => {
    expect(util.allElemsSame([1, 1, 1])).toBe(true);
});
test("[1,1,10] has sadifferent elems", () => {
    expect(util.allElemsSame([1, 1, 10])).toBe(false);
});
