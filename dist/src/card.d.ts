import { Card, Deck, Rank, Suit } from "./types";
import * as IO from "fp-ts/lib/IO";
/**
 *
 * @param wcJoker
 * @returns a function that takes a card and determines if that card is a joker
 *          for a game with given wildcard joker
 */
export declare const isJoker: (wcJoker: Card) => (card: Card) => boolean;
/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
export declare const getRankOrdinal: (rank: Rank) => number;
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
export declare function getRandomCard(): IO.IO<string>;
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
export declare function strToCard(cardStr: string): Card;
export declare function mkCard(s: Suit, r: Rank): Card;
export declare function cardToJSON(card: Card): string;
export declare const serializeCard: typeof cardToJSON;
export declare const deserializeCard: typeof mkCard;
/**
 * get Points for Card
 * @param c
 * @returns
 */
export declare function pointsOfCard(c: Card): number;
/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */
export declare const mkDeck: () => Deck;
export declare function getSuitCards(s: Suit): Deck;
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
export declare const shuffleDeck: (deck: Deck) => IO.IO<Deck>;
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */
export declare const mergeDecks: (decks: readonly Deck[]) => Deck;
export declare const RankOrd: import("fp-ts/lib/Ord").Ord<Card>;
