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
 * Get all suits
 */
export const getSuits = (): readonly Suit[] => Object.values(Suit);

/**
 * Get non joker suits
 * @returns
 */
export const getNonJokerSuits = (): readonly Suit[] => getSuits().filter(s => s !== Suit.Joker);

/**
 * Get all ranks
 */
export const getRanks = (): readonly Rank[] => Object.values(Rank);

/**
 * Get all non joker ranks
 */
export const getNonJokerRanks = (): readonly Rank[] => getRanks().filter(r => r !== Rank.Joker);

/**
 * Get all cards
 */
export const getAllCards = (): readonly Card[] => {
    const suits = getNonJokerSuits();
    const ranks = getNonJokerRanks();
    return R.append(mkCard(Suit.Joker, Rank.Joker))(R.flatten(suits.map(s => ranks.map(r => ({ suit: s, rank: r })))));
}
/**
 * Make an ordered Deck with 52 standard cards + n jokers
 * @returns Deck
 */

export const mkDeck = (nJokers: number): Deck => getAllCards().concat(R.repeat(mkCard(Suit.Joker, Rank.Joker), nJokers - 1));

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
export const cardFromStr = strToCard

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
    return (c.suit === Suit.Joker) ? 0 : [Rank.Ace, Rank.King, Rank.Queen, Rank.Jack].includes(c.rank) ? 10 : getRankOrdinal(c.rank)
}


export function getSuitCards(s: Suit): Deck {
    return s === Suit.Joker ?
        // Two Jokers
        [
            mkCard(Suit.Joker, Rank.Joker),
            mkCard(Suit.Joker, Rank.Joker),
        ]
        :
        R.map(r => mkCard(s, r), R.filter(r => r !== Rank.Joker)(Object.values(Rank)))

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
/**
 * Compare two cards for equality
 */
export const cardsEqual = (a: Card, b: Card): boolean =>
    a.suit === b.suit && a.rank === b.rank;
/**
 * Get Ord instance for Card Ranks
 */
export const RankOrd = fromCompare((a: Card, b: Card) => N.Ord.compare(getRankOrdinal(a.rank), getRankOrdinal(b.rank)))
