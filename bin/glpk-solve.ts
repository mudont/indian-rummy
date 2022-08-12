import { Solve, Solution, IModel } from "@mudont/js-milp-solver";
import { readonlyArray } from "fp-ts";
import { flatten, map, mapWithIndex, replicate } from "fp-ts/lib/readonlyArray";
import { identity, pipe } from "fp-ts/lib/function";
import { dealFromDeck } from "../src/game";
import { cardToJSON, mkCard, strToCard } from "../src/card";
import { Card, Deck, Rank, Suit } from "../src/types";
import * as IOE from "fp-ts/lib/IOEither";
import * as E from "fp-ts/lib/Either";
import { countBy } from "fp-ts-std/ReadonlyArray";
import * as GLPK from 'glpk.js';
const glpk = GLPK();
const options = {
    msglev: glpk.GLP_MSG_ALL,
    presol: true,
    cb: {
        call: progress => console.log(progress),
        each: 1
    }
};
const res = glpk.solve({
    name: 'LP',
    objective: {
        direction: glpk.GLP_MAX,
        name: 'obj',
        vars: [
            { name: 'x1', coef: 0.6 },
            { name: 'x2', coef: 0.5 }
        ]
    },
    subjectTo: [
        {
            name: 'cons1',
            vars: [
                { name: 'x1', coef: 1.0 },
                { name: 'x2', coef: 2.0 }
            ],
            bnds: { type: glpk.GLP_UP, ub: 1.0, lb: 0.0 }
        },
        {
            name: 'cons2',
            vars: [
                { name: 'x1', coef: 3.0 },
                { name: 'x2', coef: 1.0 }
            ],
            bnds: { type: glpk.GLP_UP, ub: 2.0, lb: 0.0 }
        }
    ]
}, options);

const numPlayers = 1;
const numCardsInHand = 2;
const suits = [Suit.Clubs, Suit.Diamonds,];
const ranks = [Rank.Ace, Rank.Two, Rank.Three, Rank.Four,];
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
const sets: readonly (readonly [string, string])[] =
    [
        ["CA", "C2"], //x,j 0
        ["C2", "C3"], //x 1
        ["C3", "CA"], //x 2
        ["DA", "D2"], //x 3
        ["D2", "D3"], //x 4
        ["D3", "DA"], //x 5
        ["CA", "DA"], //x 6
        ["C2", "D3"], //x 7
        ["C3", "D3"], //x 8
    ]
const cards: readonly string[] = [
    "CA", //y,i 0
    "C1", // 1
    "C2", // 2
    "DA", // 3
    "D1", // 4
    "D2", // 5
]
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
const vals = mapWithIndex(
    (i: number, c: string) => {
        const r = c[1];
        return r === "A" ? 10 : parseInt(r, 10);
    })(cards);
const setToCard = pipe(
    sets,
    mapWithIndex(
        (j: number, s: readonly [string, string]): readonly (readonly [number, number, number])[] =>
            pipe(
                cards,
                mapWithIndex(
                    (i: number, c: string): readonly [number, number, number] => {
                        return [i, j, c === s[0] || c === s[1] ? 1 : 0];
                    })
            )
    ),
    flatten
);
const deck =
    pipe(
        cards,
        mapWithIndex(
            (i: number, c: string) => {
                return replicate(n, c);
            }),
        flatten,
        map(strToCard)
    );
// export declare const chain:      <E, A, B>(f: (a: A) => IOEither<E, B>) => (ma: IOEither<E, A>) => IOEither<E, B>
// export declare const chainFirst: <E, A, B>(f: (a: A) => IOEither<E, B>) => (ma: IOEither<E, A>) => IOEither<E, A>

const hand = pipe(
    dealFromDeck(deck, numPlayers, numCardsInHand),
    IOE.chain<Error, readonly [Deck, readonly (readonly Card[])[], Card, Card], readonly Card[]>(
        (deal) => IOE.right(deal[1][0])),
    f => f(),
    E.fold(() => [] as readonly Card[], (h) => h),
    map(cardToJSON),
    countBy(identity),
    cardCounts => map((c: string): number => cardCounts[c] || 0)(cards),
)
// const hand = ["CA", "C1", "D2", "C4"];

// eslint-disable-next-line functional/no-expression-statement
console.log(`vals: ${JSON.stringify(vals)}`);
// eslint-disable-next-line functional/no-expression-statement
console.log(`setToCard: ${JSON.stringify(setToCard)}`);
// eslint-disable-next-line functional/no-expression-statement
console.log(`deck: ${JSON.stringify(deck)}`);
// eslint-disable-next-line functional/no-expression-statement
console.log(`hand: ${JSON.stringify(hand)}`);

const rummyModel: IModel = {
    "optimize": "points",
    "opType": "max",
    "constraints": {
        "CA_hms": { "equal": 0 },
        "C2_hms": { "equal": 0 },
        "C3_hms": { "equal": 0 },
        "DA_hms": { "equal": 0 },
        "D2_hms": { "equal": 0 },
        "D3_hms": { "equal": 0 },

        "x0": { "min": 0, "max": n },
        "x1": { "min": 0, "max": n, },
        "x2": { "min": 0, "max": n, },
        "x3": { "min": 0, "max": n, },
        "x4": { "min": 0, "max": n, },
        "x5": { "min": 0, "max": n, },
        "x6": { "min": 0, "max": n, },
        "x7": { "min": 0, "max": n, },
        "x8": { "min": 0, "max": n, },

        "y0": { "min": 0, "max": Math.min(hand[0], n), },
        "y1": { "min": 0, "max": Math.min(hand[1], n), },
        "y2": { "min": 0, "max": Math.min(hand[2], n), },
        "y3": { "min": 0, "max": Math.min(hand[3], n), },
        "y4": { "min": 0, "max": Math.min(hand[4], n), },
        "y5": { "min": 0, "max": Math.min(hand[5], n), }
    },
    "variables": {
        "x0": { "CA_hms": 1, "C2_hms": 1 },
        "x1": { "C2_hms": 1, "C3_hms": 1 },
        "x2": { "C3_hms": 1, "CA_hms": 1 },
        "x3": { "DA_hms": 1, "D2_hms": 1 },
        "x4": { "D2_hms": 1, "D3_hms": 1 },
        "x5": { "D3_hms": 1, "DA_hms": 1 },
        "x6": { "CA_hms": 1, "DA_hms": 1 },
        "x7": { "C2_hms": 1, "D2_hms": 1 },
        "x8": { "C3_hms": 1, "D3_hms": 1 },

        "y0": { "CA_hms": -1, "points": 10 },
        "y1": { "C2_hms": -1, "points": 2 },
        "y2": { "C3_hms": -1, "points": 3 },
        "y3": { "DA_hms": -1, "points": 10 },
        "y4": { "D2_hms": -1, "points": 2 },
        "y5": { "D3_hms": -1, "points": 3 }

    },
    "ints": {
        "x0": 1,
        "x1": 1,
        "x2": 1,
        "x3": 1,
        "x4": 1,
        "x5": 1,
        "x6": 1,
        "x7": 1,
        "x8": 1,
        "y0": 1,
        "y1": 1,
        "y2": 1,
        "y3": 1,
        "y4": 1,
        "y5": 1,
    }
};

// eslint-disable-next-line functional/no-expression-statement
console.log(`rummyModel: ${JSON.stringify(rummyModel, null, 2)}`);

const resultsRummy: Solution<string> = Solve(rummyModel);
// eslint-disable-next-line functional/no-expression-statement
console.log(resultsRummy);
// eslint-disable-next-line functional/no-expression-statement
console.log(`resultsRummy: ${JSON.stringify(resultsRummy)}`);
