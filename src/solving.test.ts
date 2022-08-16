/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
import * as RA from 'fp-ts/lib/ReadonlyArray'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import { Hand, Rank, Suit } from './types';
import { mkCard, strToCard } from './card';
import { cardsInSequence, cardsInTriplet, meldToJSON } from './meld';
import Debug from 'debug';
import { checkIfWinningHand, solveHand } from './solving';

const debug = Debug('test:solving');

// cards represeneted as two character strings
// joker are "J1"
// Ohter cards are represented as  "<suit><rank>"
// suit characters are: "S" for Spades, "H" for Hearts, "D" for Diamonds, "C" for Clubs
// rank characters are: "A" for Ace, "2" for 2, ...,
//    "T" for 10, "J" for Jack, "Q" for Queen, "K" for King
const poorHand = RA.map(strToCard)(
    [
        'CA', 'J1', 'C3',
        'C7', 'D7', 'H7', 'S7',
        'HT', 'DJ', 'HQ',
        'CA', 'H2', 'S3',
    ])
const winningHand = RA.map(strToCard)(
    [
        'CA', 'C7', 'D7', 'H7', 'S7', 'C3',
        'HT', 'HJ', 'HQ',
        'J1', 'J1', 'D1', 'C2',
    ])
const lifelessHand = RA.map(strToCard)(
    [
        'CA', 'J1', 'C3',
        'C7', 'D7', 'H7', 'S7',
        'HT', 'DJ', 'HQ',
        'CA', 'H2', 'S3',
    ])

// Make a wildcard joker
const wcj = mkCard(Suit.Diamonds, Rank.Ace);


const initializeOnce = () => {
    return undefined
}
const finalizeAtEnd = () => {
    return undefined
}
const initializeBeforeEachTest = () => {
    return undefined
}
const finalizeAfterEachTest = () => {
    return undefined
}

// eslint-disable-next-line functional/prefer-tacit
beforeAll(() => {
    return initializeOnce();
});

// eslint-disable-next-line functional/prefer-tacit
afterAll(() => {
    return finalizeAtEnd();
});

beforeEach(() => {
    initializeBeforeEachTest();
});

afterEach(() => {
    finalizeAfterEachTest();
});

describe('Solving Hand', () => {
    test("poor hand has 80 points", () => {
        const melds = pipe(
            solveHand(wcj, poorHand)
        )
        expect(melds[0].points).toBe(80);
    });

    test("Winning hand has 0 points", () => {
        const melds = pipe(
            solveHand(wcj, winningHand)
        )
        const s = meldToJSON(melds[0])
        const l = melds[0].life && cardsInSequence(melds[0].life)
        const t = cardsInTriplet(melds[0].triplets[0])
        expect(l?.length).toBe(3);
        expect(t.length).toBe(4);

        expect(s).toContain("Life");
        expect(melds[0].points).toBe(0);
    });
    test("Winning hand is Winning", () => {
        expect(E.isRight(checkIfWinningHand(wcj, winningHand))).toBe(true);
    });
    test("Bad hand isn't Winning", () => {
        expect(E.isLeft(checkIfWinningHand(wcj, poorHand))).toBe(true);
    });

});