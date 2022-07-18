import * as R from "ramda";
import { Card, Deck, Rank } from "./types";
/**
 *
 * @param game
 * @returns a function that takes a card and determines if that card is a joker for this game
 */
export declare const isJoker: (gameJoker: Card) => (card: Card) => boolean;
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
export declare function getRandomCard(): string;
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
export declare function makeCard(cardStr: string): Card;
export declare const deserializeCard: typeof makeCard;
export declare const gamePlayersLens: R.Lens<Record<"players", unknown> & Omit<unknown, "players">, any>;
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
export declare function makeDeck(): Deck;
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
export declare const shuffleDeck: (deck: Deck) => Deck;
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */
export declare const mergeDecks: (decks: Deck[]) => Deck;
