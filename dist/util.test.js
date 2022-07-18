"use strict";
const util = require("./util");
test("sum([1,2] equals 3", () => {
    expect(util.sum([1, 2])).toBe(3);
});
