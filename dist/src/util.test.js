"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
const util = __importStar(require("./util"));
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
