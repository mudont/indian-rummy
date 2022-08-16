/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
import * as C from "./combinatorics";

test("numericCartesianProduct", () => {
    const ncp = Array.from(C.numericCartesianProduct([2, 3]));
    expect(ncp.length).toBe(2 * 3);
    expect(ncp[0].length).toBe(2);

});

test("CartesianProduct", () => {
    const cp = Array.from(C.cartesianProduct([1, 6], [2, 3]));
    expect(cp.length).toBe(4);
    expect(cp[0].length).toBe(2);
});

test("Permutations", () => {
    const cp = Array.from(C.permutations([1, 6, 2, 3]));
    expect(cp.length).toBe(24);
});
