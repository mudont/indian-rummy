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
 * Get all suits
 */
export declare const getSuits: () => readonly Suit[];
/**
 * Get non joker suits
 * @returns
 */
export declare const getNonJokerSuits: () => readonly Suit[];
/**
 * Get all ranks
 */
export declare const getRanks: () => readonly Rank[];
/**
 * Get all non joker ranks
 */
export declare const getNonJokerRanks: () => readonly Rank[];
/**
 * Get all cards
 */
export declare const getAllCards: () => readonly Card[];
/**
 * Make an ordered Deck with 52 standard cards + n jokers
 * @returns Deck
 */
export declare const mkDeck: (nJokers: number) => Deck;
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
export declare const cardFromStr: typeof strToCard;
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
/**
 * Compare two cards for equality
 */
export declare const cardsEqual: (a: Card, b: Card) => boolean;
/**
 * Get Ord instance for Card Ranks
 */
export declare const RankOrd: import("fp-ts/lib/Ord").Ord<Card>;
