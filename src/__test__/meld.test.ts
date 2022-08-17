/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
import * as RA from 'fp-ts/lib/ReadonlyArray'
import { pipe } from 'fp-ts/lib/function'
import * as E from 'fp-ts/lib/Either'
import { Hand, Rank, Suit } from '../types';
import { mkCard, strToCard } from '../card';
import { cardsInSequence, cardsInTriplet, enumerateMeldedHand, meldToJSON, mkLife, mkNominalMeldedHand, mkSequence, mkTriplet, mkWinningHand } from '../meld';
import Debug from 'debug';
import { checkIfWinningHand, solveHand } from '../solving';

const debug = Debug('test:meld');

// Make a wildcard joker
const wcj = mkCard(Suit.Diamonds, Rank.Ace);
const poorHand = RA.map(strToCard)(
    [
        'CA', 'J1', 'C3',
        'C7', 'D7', 'H7', 'S7',
        'HT', 'DJ', 'HQ',
        'CA', 'H2', 'S3',
    ])
const miracleHand = RA.map(strToCard)(
    [
        'CA', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'CJ', 'DJ', 'AJ'
    ])
test("mkNominalMeldedHand", () => {
    const m = mkNominalMeldedHand(wcj, poorHand)
    expect(m.looseCards.length).toBe(13);
});
test("mkWinningHand", () => {
    const m = mkWinningHand(wcj,
        [mkSequence(miracleHand[5].suit, miracleHand.slice(0, 5), wcj),
        mkSequence(miracleHand[5].suit, miracleHand.slice(5, 10), wcj),],
        [mkTriplet(miracleHand[10].rank, miracleHand.slice(10, 13), wcj)])
    const r = E.fold((e: Error) => e.message, meldToJSON)(m)

    expect(r).toContain("Life");
    const cards = pipe(
        m,
        E.map(enumerateMeldedHand),
    )
    expect(E.isRight(cards)).toBeTruthy();
});