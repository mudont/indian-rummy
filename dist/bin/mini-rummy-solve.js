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
const readonlyArray_1 = require("fp-ts/lib/readonlyArray");
const function_1 = require("fp-ts/lib/function");
const game_1 = require("../src/game");
const card_1 = require("../src/card");
const types_1 = require("../src/types");
const IOE = __importStar(require("fp-ts/lib/IOEither"));
const E = __importStar(require("fp-ts/lib/Either"));
const ReadonlyArray_1 = require("fp-ts-std/ReadonlyArray");
const numPlayers = 1;
const numCardsInHand = 2;
const suits = [types_1.Suit.Clubs, types_1.Suit.Diamonds,];
const ranks = [types_1.Rank.Ace, types_1.Rank.Two, types_1.Rank.Three, types_1.Rank.Four,];
/*
PROBLEM: score a mini rummy hand .
Mini rummy: 2 suits (Clubs, Diamonds), 5 cards (A to 5) each suit, no jokers.
sets of 2 cards.
sequences and doublets
seq C{A1, 12, 23, 34, 4A}
seq D{A1, 12, 23, 34, 4A}
doub {CD}A, {CD}2, {CD}3, {CD}4
total 14 possible sets
*/
const sets = [
    ["CA", "C2"],
    ["C2", "C3"],
    ["C3", "CA"],
    ["DA", "D2"],
    ["D2", "D3"],
    ["D3", "DA"],
    ["CA", "DA"],
    ["C2", "D3"],
    ["C3", "D3"], //x 8
];
const cards = [
    "CA",
    "C1",
    "C2",
    "DA",
    "D1",
    "D2", // 5
];
/*
hand size 4 cards
n decks

i: index of card in cards
j: index of set in sets

Params (constant for optimization problem):
S_ij = 1 if card i is in set j
h_i = num copies of card i in hand: 0,...,n
v_i = value of card i: 1,...10

x_j: number of copies of set j in hand: 0,...,n
y_i: number of copies of card i in hand that can go into sets: 0,...,n

Maximize: sum(y_i, v_i)
Subject to:
    foreach card i:
        sum_j(S_ij * x_j) = y_i
        y_i in [0,n]
        y_i <= h_i
    foreach set j:
        x_j in [0,n]


*/
const n = 2; // number of decks
const vals = (0, readonlyArray_1.mapWithIndex)((i, c) => {
    const r = c[1];
    return r === "A" ? 10 : parseInt(r, 10);
})(cards);
const setToCard = (0, function_1.pipe)(sets, (0, readonlyArray_1.mapWithIndex)((j, s) => (0, function_1.pipe)(cards, (0, readonlyArray_1.mapWithIndex)((i, c) => {
    return [i, j, c === s[0] || c === s[1] ? 1 : 0];
}))), readonlyArray_1.flatten);
const deck = (0, function_1.pipe)(cards, (0, readonlyArray_1.mapWithIndex)((i, c) => {
    return (0, readonlyArray_1.replicate)(n, c);
}), readonlyArray_1.flatten, (0, readonlyArray_1.map)(card_1.strToCard));
// export declare const chain:      <E, A, B>(f: (a: A) => IOEither<E, B>) => (ma: IOEither<E, A>) => IOEither<E, B>
// export declare const chainFirst: <E, A, B>(f: (a: A) => IOEither<E, B>) => (ma: IOEither<E, A>) => IOEither<E, A>
const hand = (0, function_1.pipe)((0, game_1.dealFromDeck)(deck, numPlayers, numCardsInHand), IOE.chain((deal) => IOE.right(deal[1][0])), f => f(), E.fold(() => [], (h) => h), (0, readonlyArray_1.map)(card_1.cardToJSON), (0, ReadonlyArray_1.countBy)(function_1.identity), cardCounts => (0, readonlyArray_1.map)((c) => cardCounts[c] || 0)(cards));
// const hand = ["CA", "C1", "D2", "C4"];
// eslint-disable-next-line functional/no-expression-statement
console.log(`vals: ${JSON.stringify(vals)}`);
// eslint-disable-next-line functional/no-expression-statement
console.log(`setToCard: ${JSON.stringify(setToCard)}`);
// eslint-disable-next-line functional/no-expression-statement
console.log(`deck: ${JSON.stringify(deck)}`);
// eslint-disable-next-line functional/no-expression-statement
console.log(`hand: ${JSON.stringify(hand)}`);
// const rummyModel: IModel = {
//     "optimize": "points",
//     "opType": "max",
//     "constraints": {
//         "CA_hms": { "equal": 0 },
//         "C2_hms": { "equal": 0 },
//         "C3_hms": { "equal": 0 },
//         "DA_hms": { "equal": 0 },
//         "D2_hms": { "equal": 0 },
//         "D3_hms": { "equal": 0 },
//         "x0": { "min": 0, "max": n },
//         "x1": { "min": 0, "max": n, },
//         "x2": { "min": 0, "max": n, },
//         "x3": { "min": 0, "max": n, },
//         "x4": { "min": 0, "max": n, },
//         "x5": { "min": 0, "max": n, },
//         "x6": { "min": 0, "max": n, },
//         "x7": { "min": 0, "max": n, },
//         "x8": { "min": 0, "max": n, },
//         "y0": { "min": 0, "max": Math.min(hand[0], n), },
//         "y1": { "min": 0, "max": Math.min(hand[1], n), },
//         "y2": { "min": 0, "max": Math.min(hand[2], n), },
//         "y3": { "min": 0, "max": Math.min(hand[3], n), },
//         "y4": { "min": 0, "max": Math.min(hand[4], n), },
//         "y5": { "min": 0, "max": Math.min(hand[5], n), }
//     },
//     "variables": {
//         "x0": { "CA_hms": 1, "C2_hms": 1 },
//         "x1": { "C2_hms": 1, "C3_hms": 1 },
//         "x2": { "C3_hms": 1, "CA_hms": 1 },
//         "x3": { "DA_hms": 1, "D2_hms": 1 },
//         "x4": { "D2_hms": 1, "D3_hms": 1 },
//         "x5": { "D3_hms": 1, "DA_hms": 1 },
//         "x6": { "CA_hms": 1, "DA_hms": 1 },
//         "x7": { "C2_hms": 1, "D2_hms": 1 },
//         "x8": { "C3_hms": 1, "D3_hms": 1 },
//         "y0": { "CA_hms": -1, "points": 10 },
//         "y1": { "C2_hms": -1, "points": 2 },
//         "y2": { "C3_hms": -1, "points": 3 },
//         "y3": { "DA_hms": -1, "points": 10 },
//         "y4": { "D2_hms": -1, "points": 2 },
//         "y5": { "D3_hms": -1, "points": 3 }
//     },
//     "ints": {
//         "x0": 1,
//         "x1": 1,
//         "x2": 1,
//         "x3": 1,
//         "x4": 1,
//         "x5": 1,
//         "x6": 1,
//         "x7": 1,
//         "x8": 1,
//         "y0": 1,
//         "y1": 1,
//         "y2": 1,
//         "y3": 1,
//         "y4": 1,
//         "y5": 1,
//     }
// };
// // eslint-disable-next-line functional/no-expression-statement
// console.log(`rummyModel: ${JSON.stringify(rummyModel, null, 2)}`);
// const resultsRummy: Solution<string> = Solve(rummyModel);
// // eslint-disable-next-line functional/no-expression-statement
// console.log(resultsRummy);
// // eslint-disable-next-line functional/no-expression-statement
// console.log(`resultsRummy: ${JSON.stringify(resultsRummy)}`);
// const model2: IModel = {
//     "optimize": "profit",
//     "opType": "max",
//     "constraints": {
//         "wood": { "max": 300 },
//         "labor": { "max": 110 },
//         "storage": { "max": 400 },
//     },
//     "variables": {
//         "table": { "wood": 30, "labor": 5, "profit": 1200, "table": 1, "storage": 30 },
//         "dresser": { "wood": 20, "labor": 10, "profit": 1600, "dresser": 1, "storage": 50 }
//     },
//     "ints": { "table": 1, "dresser": 1 }
// };
// const results2: Solution<string> = Solve(model2);
// // eslint-disable-next-line functional/no-expression-statement
// console.log(results2);
