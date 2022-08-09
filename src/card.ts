import assert from "assert";
import { pipe } from "fp-ts/lib/function";
import { fromCompare } from "fp-ts/lib/Ord";
import * as R from "ramda";
import * as N from "fp-ts/number"
import { Card, Deck, GameRestricted, Rank, Suit } from "./types";
import { sort } from "fp-ts/lib/ReadonlyArray";
import { sequence } from "fp-ts/lib/Array"
import * as Rand from "fp-ts/lib/Random"
import * as IO from "fp-ts/lib/IO";

//-------------------------------=============================================
/**
 *
 * @param wcJoker
 * @returns a function that takes a card and determines if that card is a joker
 *          for a game with given wildcard joker
 */
export const isJoker = (wcJoker: Card) => (card: Card): boolean => card === wcJoker || card.suit === Suit.Joker;
/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
export const getRankOrdinal = (rank: Rank): number => {
    return rank == Rank.Ace ? 1 : Object.values(Rank).indexOf(rank);
};
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
// eslint-disable-next-line functional/functional-parameters
export function getRandomCard(): IO.IO<string> {
    const suits = Array.from("CDHS");
    const ranks = Array.from("A23456789TJQK");
    const makeCard = (is: number) => (ir: number) => suits[is] + ranks[ir];

    return pipe(
        IO.of(makeCard),
        IO.ap(Rand.randomInt(0, suits.length)),
        IO.ap(Rand.randomInt(0, ranks.length))
    )
}
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */

export function strToCard(cardStr: string): Card {
    //assert(cardStr.length === 2);
    return { suit: cardStr[0] as Suit, rank: cardStr[1] as Rank };
}
export function mkCard(s: Suit, r: Rank): Card { return strToCard(s + r) }

export function cardToJSON(card: Card) {
    return card.suit + card.rank;
}

export const serializeCard = cardToJSON;

export const deserializeCard = mkCard;


/**
 * get Points for Card
 * @param c
 * @returns
 */
export function pointsOfCard(c: Card): number {
    return [Rank.Ace, Rank.King, Rank.Queen, Rank.Jack].includes(c.rank) ? 10 : getRankOrdinal(c.rank)
}
/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */

export const mkDeck = (): Deck => R.flatten(R.map(getSuitCards, Object.values(Suit)))


export function getSuitCards(s: Suit): Deck {
    return s === Suit.Joker ?
        // Two Jokers
        [
            mkCard(Suit.Joker, Rank.One),
            mkCard(Suit.Joker, Rank.One),
        ]
        :
        R.map(r => mkCard(s, r), R.filter(r => r !== Rank.One)(Object.values(Rank)))

}
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */

export const shuffleDeck = (deck: Deck): IO.IO<Deck> => {
    const attachRandToCard = (c: Card): IO.IO<readonly [number, Card]> => {
        return pipe(
            Rand.random,
            IO.map((n: number) => [n, c])
        )
    }
    const deckWithRands = IO.sequenceArray(R.map(attachRandToCard, deck));
    return IO.chain(
        (dwr: readonly (readonly [number, Card])[]) =>
            IO.of(
                R.map(([a, b]: readonly [number, Card]) => b,
                    R.sort<readonly [number, Card]>(
                        (a, b) => a[0] - b[0],
                        dwr
                    )
                )
            )
    )(deckWithRands);

};
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */

export const mergeDecks = (decks: readonly Deck[]): Deck => {
    const d: Deck = [];
    return d.concat(...decks);
};

export const RankOrd = fromCompare((a: Card, b: Card) => N.Ord.compare(getRankOrdinal(a.rank), getRankOrdinal(b.rank)))
