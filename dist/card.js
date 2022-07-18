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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDecks = exports.shuffleDeck = exports.makeDeck = exports.pointsOfCard = exports.gamePlayersLens = exports.deserializeCard = exports.makeCard = exports.getRandomCard = exports.getRankOrdinal = exports.isJoker = void 0;
const assert_1 = __importDefault(require("assert"));
const R = __importStar(require("ramda"));
const types_1 = require("./types");
//-------------------------------=============================================
/**
 *
 * @param game
 * @returns a function that takes a card and determines if that card is a joker for this game
 */
const isJoker = (gameJoker) => (card) => card === gameJoker || card.suit === types_1.Suit.Joker;
exports.isJoker = isJoker;
/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
const getRankOrdinal = (rank) => {
    return Object.values(types_1.Rank).indexOf(rank);
};
exports.getRankOrdinal = getRankOrdinal;
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
function getRandomCard() {
    const suits = Array.from("CDHS");
    const ranks = Array.from("A23456789TJQK");
    const s = suits[Math.floor(Math.random() * suits.length)];
    const r = ranks[Math.floor(Math.random() * ranks.length)];
    return s + r;
}
exports.getRandomCard = getRandomCard;
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
function makeCard(cardStr) {
    (0, assert_1.default)(cardStr.length === 2);
    return new types_1.Card(cardStr[0], cardStr[1]);
}
exports.makeCard = makeCard;
exports.deserializeCard = makeCard;
exports.gamePlayersLens = R.lens((R.prop('players')), R.assoc('players'));
/**
 * get Points for Card
 * @param c
 * @returns
 */
function pointsOfCard(c) {
    if ([types_1.Rank.Ace, types_1.Rank.King, types_1.Rank.Queen, types_1.Rank.Jack].includes(c.rank)) {
        return 10;
    }
    else {
        return (0, exports.getRankOrdinal)(c.rank);
    }
}
exports.pointsOfCard = pointsOfCard;
/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */
function makeDeck() {
    const deck = [];
    for (const s of Object.values(types_1.Suit)) {
        if (s === types_1.Suit.Joker) {
            // Two Jokers
            deck.push(new types_1.Card(types_1.Suit.Joker, types_1.Rank.One));
            deck.push(new types_1.Card(types_1.Suit.Joker, types_1.Rank.One));
            continue;
        }
        for (const r of Object.values(types_1.Rank)) {
            if (r !== types_1.Rank.One) {
                const card = new types_1.Card(s, r);
                deck.push(card);
            }
        }
    }
    return deck;
}
exports.makeDeck = makeDeck;
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
const shuffleDeck = (deck) => {
    return deck
        .map((value) => ({ value, randKey: Math.random() }))
        .sort((a, b) => a.randKey - b.randKey)
        .map(({ value }) => value);
};
exports.shuffleDeck = shuffleDeck;
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */
const mergeDecks = (decks) => {
    const d = [];
    return d.concat(...decks);
};
exports.mergeDecks = mergeDecks;
