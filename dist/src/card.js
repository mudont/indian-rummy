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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankOrd = exports.mergeDecks = exports.shuffleDeck = exports.getSuitCards = exports.mkDeck = exports.pointsOfCard = exports.deserializeCard = exports.serializeCard = exports.cardToJSON = exports.mkCard = exports.strToCard = exports.getRandomCard = exports.getRankOrdinal = exports.isJoker = void 0;
const function_1 = require("fp-ts/lib/function");
const Ord_1 = require("fp-ts/lib/Ord");
const R = __importStar(require("ramda"));
const N = __importStar(require("fp-ts/number"));
const types_1 = require("./types");
const Rand = __importStar(require("fp-ts/lib/Random"));
const IO = __importStar(require("fp-ts/lib/IO"));
//-------------------------------=============================================
/**
 *
 * @param wcJoker
 * @returns a function that takes a card and determines if that card is a joker
 *          for a game with given wildcard joker
 */
const isJoker = (wcJoker) => (card) => card === wcJoker || card.suit === types_1.Suit.Joker;
exports.isJoker = isJoker;
/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
const getRankOrdinal = (rank) => {
    return rank == types_1.Rank.Ace ? 1 : Object.values(types_1.Rank).indexOf(rank);
};
exports.getRankOrdinal = getRankOrdinal;
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
// eslint-disable-next-line functional/functional-parameters
function getRandomCard() {
    const suits = Array.from("CDHS");
    const ranks = Array.from("A23456789TJQK");
    const makeCard = (is) => (ir) => suits[is] + ranks[ir];
    return (0, function_1.pipe)(IO.of(makeCard), IO.ap(Rand.randomInt(0, suits.length)), IO.ap(Rand.randomInt(0, ranks.length)));
}
exports.getRandomCard = getRandomCard;
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
function strToCard(cardStr) {
    //assert(cardStr.length === 2);
    return { suit: cardStr[0], rank: cardStr[1] };
}
exports.strToCard = strToCard;
function mkCard(s, r) { return strToCard(s + r); }
exports.mkCard = mkCard;
function cardToJSON(card) {
    return card.suit + card.rank;
}
exports.cardToJSON = cardToJSON;
exports.serializeCard = cardToJSON;
exports.deserializeCard = mkCard;
/**
 * get Points for Card
 * @param c
 * @returns
 */
function pointsOfCard(c) {
    return [types_1.Rank.Ace, types_1.Rank.King, types_1.Rank.Queen, types_1.Rank.Jack].includes(c.rank) ? 10 : (0, exports.getRankOrdinal)(c.rank);
}
exports.pointsOfCard = pointsOfCard;
/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */
const mkDeck = () => R.flatten(R.map(getSuitCards, Object.values(types_1.Suit)));
exports.mkDeck = mkDeck;
function getSuitCards(s) {
    return s === types_1.Suit.Joker ?
        // Two Jokers
        [
            mkCard(types_1.Suit.Joker, types_1.Rank.One),
            mkCard(types_1.Suit.Joker, types_1.Rank.One),
        ]
        :
            R.map(r => mkCard(s, r), R.filter(r => r !== types_1.Rank.One)(Object.values(types_1.Rank)));
}
exports.getSuitCards = getSuitCards;
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
const shuffleDeck = (deck) => {
    const attachRandToCard = (c) => {
        return (0, function_1.pipe)(Rand.random, IO.map((n) => [n, c]));
    };
    const deckWithRands = IO.sequenceArray(R.map(attachRandToCard, deck));
    return IO.chain((dwr) => IO.of(R.map(([a, b]) => b, R.sort((a, b) => a[0] - b[0], dwr))))(deckWithRands);
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
exports.RankOrd = (0, Ord_1.fromCompare)((a, b) => N.Ord.compare((0, exports.getRankOrdinal)(a.rank), (0, exports.getRankOrdinal)(b.rank)));
