"use strict";
const util = require("./util");
test("sum([1,2] equals 3", () => {
    expect(util.sum([1, 2])).toBe(3);
});
test("Empty arry sums to 0", () => {
    expect(util.sum([])).toBe(0);
});
test("Set diff typical", () => {
    expect(util.setDiff(new Set([1, 2, 3]), new Set([3, 4]))).toStrictEqual(new Set([1, 2]));
});
test("Set diff empty", () => {
    expect(util.setDiff(new Set([1, 2, 3]), new Set([1, 2, 3, 5, 4]))).toStrictEqual(new Set([]));
});
test("[1,2,3] has no dups", () => {
    expect(util.hasDuplicates([1, 2, 3])).toBe(false);
});
test("[1,2,1] has dups", () => {
    expect(util.hasDuplicates([1, 2, 1])).toBe(true);
});
