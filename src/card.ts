import assert from "assert";
import * as R from "ramda";
import { Card, Deck, GameRestricted, Rank, Suit } from "./types";

//-------------------------------=============================================
/**
 *
 * @param game
 * @returns a function that takes a card and determines if that card is a joker for this game
 */
export const isJoker = (gameJoker: Card) => (card: Card): boolean => card === gameJoker || card.suit === Suit.Joker;
/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
export const getRankOrdinal = (rank: Rank): number => {
  return Object.values(Rank).indexOf(rank);
};
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
export function getRandomCard(): string {
  const suits = Array.from("CDHS");
  const ranks = Array.from("A23456789TJQK");
  const s = suits[Math.floor(Math.random() * suits.length)];
  const r = ranks[Math.floor(Math.random() * ranks.length)];

  return s + r;
}
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */

export function makeCard(cardStr: string): Card {
  assert(cardStr.length === 2);
  return new Card(cardStr[0] as Suit, cardStr[1] as Rank);
}
export const deserializeCard = makeCard;

export const gamePlayersLens = R.lens(R.prop('players')<any>, R.assoc('players'));

/**
 * get Points for Card
 * @param c
 * @returns
 */
export function pointsOfCard(c: Card): number {
  if ([Rank.Ace, Rank.King, Rank.Queen, Rank.Jack].includes(c.rank)) {
    return 10;
  } else {
    return getRankOrdinal(c.rank);
  }
}
/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */

export function makeDeck(): Deck {
  const deck: Deck = [];

  for (const s of Object.values(Suit)) {
    if (s === Suit.Joker) {
      // Two Jokers
      deck.push(new Card(Suit.Joker, Rank.One));
      deck.push(new Card(Suit.Joker, Rank.One));
      continue;
    }
    for (const r of Object.values(Rank)) {
      if (r !== Rank.One) {
        const card: Card = new Card(s, r);
        deck.push(card);
      }
    }
  }
  return deck;
}
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */

export const shuffleDeck = (deck: Deck): Deck => {
  return deck
    .map((value) => ({ value, randKey: Math.random() }))
    .sort((a, b) => a.randKey - b.randKey)
    .map(({ value }) => value);
};
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */

export const mergeDecks = (decks: Deck[]): Deck => {
  const d: Deck = [];
  return d.concat(...decks);
};
