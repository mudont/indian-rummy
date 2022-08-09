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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const G = __importStar(require("../src/game"));
const Debug_1 = require("fp-ts-std/Debug");
const debug_1 = __importDefault(require("debug"));
const function_1 = require("fp-ts/lib/function");
//import { pipe } from 'ramda';
const debug = (0, debug_1.default)('app:test-game');
// [ 0, 0, 0, 1, 3 ]
const diffs = (0, function_1.flow)(G.sequenceGaps, (0, Debug_1.traceWithValue)('tr lagDiff:'))([1, 2, 3, 5, 9]);
// eslint-disable-next-line functional/no-expression-statement
//debug(`lagDiff: ${JSON.stringify(diffs)}`);
