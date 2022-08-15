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
exports.meldedHandMatchesHand = exports.computePointsGamePlayer = exports.computePoints = exports.countPointsOfCards = exports.enumerateMeldedHand = exports.mkWinningHand = exports.meldToJSON = exports.itripletToJSON = exports.iseqToJSON = exports.ilifeToJSON = exports.mkNominalMeldedHand = exports.mkMeldFromSetVecs = exports.isTriplet = exports.mkTriplet = exports.mkSequence = exports.mkLife = exports.cardsInTriplet = exports.cardsInSequence = void 0;
const R = __importStar(require("ramda"));
const types_1 = require("./types");
const debug_1 = __importDefault(require("debug"));
const card_1 = require("./card");
const util_1 = require("./util");
const E = __importStar(require("fp-ts/lib/Either"));
const S = __importStar(require("fp-ts/lib/String"));
const RA = __importStar(require("fp-ts/lib/ReadonlyArray"));
const function_1 = require("fp-ts/lib/function");
const ReadonlyArray_1 = require("fp-ts/lib/ReadonlyArray");
const solving_1 = require("./solving");
const debug = (0, debug_1.default)("app:meld");
const FULL_COUNT_POINTS = 80;
/**
 * Get list of cards in a sequence
 * @param {ISequence} seq
 * @returns Card[]
 */
function cardsInSequence(seq) {
    return R.map((r) => (0, card_1.mkCard)(seq.suit, r))(seq.ranks);
}
exports.cardsInSequence = cardsInSequence;
/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip) {
    return R.map((s) => (0, card_1.mkCard)(s, trip.rank))(trip.suits);
}
exports.cardsInTriplet = cardsInTriplet;
const isJoker = (wcj) => (card) => (card.suit === types_1.Suit.Joker && card.rank === types_1.Rank.Joker) || card === wcj;
/** Make ISequence out of given cards.
 * Caller needs to specify the suit of the sequence (in case they are all jokers)
 *
 */
function mkLife(cards) {
    return { suit: cards[0].suit, ranks: cards.map(c => c.rank) };
}
exports.mkLife = mkLife;
/** Make ISequence out of given cards.
 * Caller needs to specify the suit of the sequence (in case they are all jokers)
 *
 */
function mkSequence(suit, cards, wcj) {
    const separated = RA.partition(isJoker(wcj))(cards);
    const [nonJokers, jokers] = [separated.left, separated.right];
    const numJokers = jokers.length;
    return { suit, ranks: nonJokers.map(c => c.rank), numJokers };
}
exports.mkSequence = mkSequence;
/** Make ITriplet out of given cards.
 * Caller needs to specify the Rank of the triplet (in case they are all jokers)
 *
 */
function mkTriplet(rank, cards, wcj) {
    const separated = RA.partition(isJoker(wcj))(cards);
    const [nonJokers, jokers] = [separated.left, separated.right];
    const numJokers = jokers.length;
    return { rank, suits: nonJokers.map(c => c.suit), numJokers };
}
exports.mkTriplet = mkTriplet;
const isTriplet = (cs) => (0, function_1.pipe)(cs, RA.map(c => c.rank), RA.filter(r => r !== types_1.Rank.Joker), (ranks) => new Set(ranks).size) === 1;
exports.isTriplet = isTriplet;
function mkMeldFromSetVecs(wcj, lifeVec, seq1Vec, set3Vec, set4Vec, looseCardsVec) {
    const set3 = (0, solving_1.countsVectorToCardList)(set3Vec);
    const set4 = (0, solving_1.countsVectorToCardList)(set4Vec);
    const tripletLists = RA.filter(exports.isTriplet)([set3, set4]);
    const sequenceLists = RA.append((0, solving_1.countsVectorToCardList)(seq1Vec))(RA.filter(cs => !(0, exports.isTriplet)(cs))([set3, set4]));
    const lifeCards = (0, solving_1.countsVectorToCardList)(lifeVec);
    const life = lifeCards.length == 0 ? undefined : mkLife(lifeCards);
    const sequences = (0, function_1.pipe)(sequenceLists, RA.filter(cs => cs.length > 0), RA.map((cs) => mkSequence(cs[0].suit, cs, wcj)));
    const triplets = (0, function_1.pipe)(tripletLists, RA.filter(cs => cs.length > 0), RA.map((cs) => mkTriplet(cs[0].rank, cs, wcj)));
    const looseCards = (0, solving_1.countsVectorToCardList)(looseCardsVec);
    const preMelded = { life, sequences, triplets, looseCards, wcj };
    const points = (0, exports.computePoints)(wcj)(preMelded);
    return Object.assign(Object.assign({}, preMelded), { points });
}
exports.mkMeldFromSetVecs = mkMeldFromSetVecs;
const mkNominalMeldedHand = (wcj, hand) => {
    const preMelded = ({ life: undefined, sequences: [], triplets: [], looseCards: hand, wcj });
    const points = (0, exports.computePoints)(wcj)(preMelded);
    return Object.assign(Object.assign({}, preMelded), { points });
};
exports.mkNominalMeldedHand = mkNominalMeldedHand;
/**
 * turn ILife to a readable string
 * @param seq
 * @returns
 */
const ilifeToJSON = (seq) => {
    const rs = RA.foldMap(S.Monoid)(r => r)(seq.ranks);
    return `*Life: ${seq.suit}->${rs}*`;
};
exports.ilifeToJSON = ilifeToJSON;
/**
 * turn ISequence to a readable string
 * @param seq
 * @returns
 */
const iseqToJSON = (seq) => {
    const rs = RA.foldMap(S.Monoid)(r => r)(seq.ranks);
    const wcs = RA.replicate(seq.numJokers, "*").join("");
    return `[Seq: ${seq.suit}->${rs}${wcs}]`;
};
exports.iseqToJSON = iseqToJSON;
/**
 * turn ISequence to a readable string
 * @param seq
 * @returns
 */
const itripletToJSON = (seq) => {
    const ss = RA.foldMap(S.Monoid)(s => s)(seq.suits);
    const wcs = RA.replicate(seq.numJokers, "*").join("");
    return ` (Triplet: ${ss}${wcs}-:${seq.rank})`;
};
exports.itripletToJSON = itripletToJSON;
const meldToJSON = (meld) => {
    const life = meld.life ? (0, exports.ilifeToJSON)(meld.life) : "";
    const sequences = RA.foldMap(S.Monoid)(exports.iseqToJSON)(meld.sequences);
    const triplets = RA.foldMap(S.Monoid)(exports.itripletToJSON)(meld.triplets);
    const looseCards = RA.foldMap(S.Monoid)(card_1.cardToJSON)(meld.looseCards);
    return `${life} / ${sequences} / ${triplets} / -${looseCards}- ==> ${meld.points} points`;
};
exports.meldToJSON = meldToJSON;
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
function mkWinningHand(wcj, sequences, triplets) {
    const cardsInSeq = (set) => set.ranks.length + set.numJokers;
    const cardsInTrip = (set) => set.suits.length + set.numJokers;
    const cardsInSet = (set) => 'ranks' in set ? cardsInSeq(set) : cardsInTrip(set);
    const nCards = (0, function_1.pipe)(sequences, (0, ReadonlyArray_1.map)(cardsInSet), (0, ReadonlyArray_1.reduce)(0, (b, a) => b + a)) + (0, function_1.pipe)(triplets, (0, ReadonlyArray_1.map)(cardsInSet), (0, ReadonlyArray_1.reduce)(0, (b, a) => b + a));
    return (0, function_1.pipe)(E.Do, E.chain(E.fromPredicate(() => nCards === 13, () => new Error("Must have 13 cards"))), E.chain(E.fromPredicate(() => sequences.length >= 2, () => new Error("Must have at least 2 sequences"))), E.chain(E.fromPredicate(() => Boolean(R.find((s) => s.numJokers === 0, sequences)), () => new Error("Must have Life sequence"))), () => E.of(sequences.length + triplets.length), E.chain(() => E.of({
        life: R.find((s) => s.numJokers === 0, sequences),
        triplets,
        sequences: sequences.filter((s) => s.numJokers > 0),
        looseCards: [],
        points: 0,
        wcj
    })));
}
exports.mkWinningHand = mkWinningHand;
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
function enumerateMeldedHand(meldedHand) {
    var _a, _b, _c, _d;
    const jokers = R.repeat((0, card_1.mkCard)(types_1.Suit.Joker, types_1.Rank.Joker), (0, util_1.sum)(R.map(R.prop("numJokers"), (_a = meldedHand.triplets) !== null && _a !== void 0 ? _a : [])) +
        (0, util_1.sum)(R.map(R.prop("numJokers"), (_b = meldedHand.sequences) !== null && _b !== void 0 ? _b : [])));
    const lifeCards = meldedHand.life ? cardsInSequence(meldedHand.life) : [];
    const sequenceCards = R.flatten(R.map(cardsInSequence, (_c = meldedHand.sequences) !== null && _c !== void 0 ? _c : []));
    const tripleCards = R.flatten(R.map(cardsInTriplet, (_d = meldedHand.triplets) !== null && _d !== void 0 ? _d : []));
    return (meldedHand.life ?
        sequenceCards.length > 0 ?
            jokers.concat(lifeCards, sequenceCards, tripleCards)
            // If no second sequence after Life,
            // can't use triplets to save points
            : jokers.concat(lifeCards)
        // If no life only Jokers can be used to save points
        : jokers);
}
exports.enumerateMeldedHand = enumerateMeldedHand;
const countPointsOfCards = (wcj, cards) => Math.min(FULL_COUNT_POINTS, (0, function_1.pipe)(cards, RA.filter(c => !(0, card_1.cardsEqual)(c, wcj)), R.map(card_1.pointsOfCard), util_1.sum));
exports.countPointsOfCards = countPointsOfCards;
const computePoints = (wcj) => (meld) => (0, exports.countPointsOfCards)(wcj, meld.looseCards);
exports.computePoints = computePoints;
/**
 * This should be in game.ts
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
function computePointsGamePlayer(game, playerIdx) {
    const cardsToCount = (0, util_1.setDiff)(new Set(game.players[playerIdx].hand), new Set(enumerateMeldedHand(game.players[playerIdx].meld)));
    return (game.players[playerIdx].status === types_1.PlayerStatus.Won) ? 0
        : Math.min(FULL_COUNT_POINTS, (0, util_1.sum)(R.map(card_1.pointsOfCard)(Array.from(cardsToCount))));
}
exports.computePointsGamePlayer = computePointsGamePlayer;
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
function meldedHandMatchesHand(meldedHand, hand) {
    return new Set(hand) === new Set(enumerateMeldedHand(meldedHand));
}
exports.meldedHandMatchesHand = meldedHandMatchesHand;
