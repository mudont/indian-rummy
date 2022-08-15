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
exports.checkIfWinningHand = exports.getFinalMelds = exports.getFinalMeldsOpt = exports.getSet3Melds = exports.getSet3MeldsOpt = exports.getSeq2Melds = exports.getSeq2MeldsOpt = exports.getLife1Melds = exports.getFeasibleSets = exports.handMinusSet = exports.setsArrData = exports.countsVectorToCardList = exports.cardListToCountsVector = exports.getCardCounts = exports.allPureTriplets = exports.getNumCardsInVec = exports.allPureSeqs = exports.allPureSeqs5 = exports.allPureSeqs4 = exports.allPureSeqs3 = exports.mkQuadruplets = exports.mkTriplets = exports.getAllButThisSuit = exports.mkSeqs = void 0;
const NEA = __importStar(require("fp-ts/lib/ReadonlyNonEmptyArray"));
const RA = __importStar(require("fp-ts/lib/ReadonlyArray"));
const function_1 = require("fp-ts/lib/function");
const card_1 = require("./card");
const types_1 = require("./types");
const E = __importStar(require("fp-ts/lib/Either"));
const C = __importStar(require("./combinatorics"));
const R = __importStar(require("ramda"));
const debug_1 = __importDefault(require("debug"));
const meld_1 = require("./meld");
const startTime = console.time("solving");
const debug = (0, debug_1.default)('app:solving');
const allRanks = (0, card_1.getNonJokerRanks)();
const wrappedRanks = RA.append(allRanks[0])(allRanks);
/**
 * Make all possible pure sequences of given length for given suit
 */
const mkSeqs = (suit, nCards, seqLen, firstCanBeLast) => {
    const nSeqs = nCards - seqLen + (firstCanBeLast ? 2 : 1);
    return (0, function_1.pipe)(NEA.range(0, nSeqs - 1), RA.map(i => (0, function_1.pipe)(NEA.range(i, i + seqLen - 1), RA.map((j) => wrappedRanks[j]), RA.map(l => (0, card_1.mkCard)(suit, l)))));
};
exports.mkSeqs = mkSeqs;
/**
 * Leave this suit out from all suits.
 * @param suit
 * @returns
 */
const getAllButThisSuit = (suit) => {
    const allSuits = (0, card_1.getNonJokerSuits)();
    return RA.filter((s) => s !== suit && s !== types_1.Suit.Joker)(allSuits);
};
exports.getAllButThisSuit = getAllButThisSuit;
/**
 * Make all possible triplets for given rank
 * @param rank
 * @returns
 */
const mkTriplets = (rank) => (0, function_1.pipe)((0, card_1.getNonJokerSuits)(), RA.map(exports.getAllButThisSuit), (0, function_1.flow)(RA.map(RA.map(suit => (0, card_1.mkCard)(suit, rank)))));
exports.mkTriplets = mkTriplets;
/**
 * Make all possible quadruplets (just one actually) for given rank
 * @param rank
 * @returns
 */
const mkQuadruplets = (rank) => (0, function_1.pipe)([(0, card_1.getNonJokerSuits)()], (0, function_1.flow)(RA.map(RA.map(suit => (0, card_1.mkCard)(suit, rank)))));
exports.mkQuadruplets = mkQuadruplets;
exports.allPureSeqs3 = RA.chain((s) => (0, exports.mkSeqs)(s, 13, 3, true))((0, card_1.getNonJokerSuits)());
exports.allPureSeqs4 = RA.chain((s) => (0, exports.mkSeqs)(s, 13, 4, true))((0, card_1.getNonJokerSuits)());
exports.allPureSeqs5 = RA.chain((s) => (0, exports.mkSeqs)(s, 13, 5, true))((0, card_1.getNonJokerSuits)());
exports.allPureSeqs = RA.flatten([
    exports.allPureSeqs3, exports.allPureSeqs4, exports.allPureSeqs5
]);
const getNumCardsInVec = (vec) => RA.reduce(0, (acc, i) => acc + i)(vec);
exports.getNumCardsInVec = getNumCardsInVec;
exports.allPureTriplets = RA.flatten(RA.map(exports.mkTriplets)((0, card_1.getNonJokerRanks)()));
const allPureGroups = RA.flatten([
    RA.chain(exports.mkQuadruplets)((0, card_1.getNonJokerRanks)()),
    exports.allPureTriplets,
]);
const allSeqsWithJokers = (0, function_1.pipe)(exports.allPureSeqs, 
// RA.takeRight(2),
RA.chain((pureSet) => RA.chain((nJokers) => (0, function_1.pipe)(C.combinations(pureSet, pureSet.length - nJokers), Array.from, RA.map(combination => combination), RA.map((shortSeq) => RA.concat(RA.replicate(nJokers, (0, card_1.mkCard)(types_1.Suit.Joker, types_1.Rank.Joker)))(shortSeq))))(NEA.range(1, pureSet.length - 1))));
const allGroupsWithJokers = (0, function_1.pipe)(allPureGroups, 
// RA.takeRight(2),
RA.chain((pureSet) => RA.chain((nJokers) => (0, function_1.pipe)(C.combinations(pureSet, pureSet.length - nJokers), Array.from, RA.map(combination => combination), RA.map((shortSeq) => RA.concat(RA.replicate(nJokers, (0, card_1.mkCard)(types_1.Suit.Joker, types_1.Rank.Joker)))(shortSeq))))(NEA.range(1, pureSet.length - 1))));
const getCardCounts = (cardList) => R.countBy(card_1.cardToJSON)(cardList);
exports.getCardCounts = getCardCounts;
const allCards = (0, card_1.getAllCards)();
/**
 * Convert a list of cards to a vector of 53 counts.
 * numInstances if the card is in the list, 0 otherwise.
 * @param cardList
 * @returns
 */
const cardListToCountsVector = (cardList) => {
    const counts = (0, exports.getCardCounts)(cardList);
    const cardsArr = Object.keys(counts);
    const countsArr = Object.values(counts);
    return RA.map(c => {
        const ix = cardsArr.findIndex(card => (0, card_1.cardsEqual)((0, card_1.cardFromStr)(card), c));
        const val = ix < 0 ? 0 : countsArr[ix];
        return val;
    })(allCards);
};
exports.cardListToCountsVector = cardListToCountsVector;
const allSequences = RA.flatten([exports.allPureSeqs, allSeqsWithJokers]);
const allSets = RA.flatten([exports.allPureSeqs, allPureGroups, allSeqsWithJokers, allGroupsWithJokers]);
const allPureSeqsVec = (0, function_1.pipe)(allSequences, RA.map(exports.cardListToCountsVector));
const allSequencesVec = (0, function_1.pipe)(allSequences, RA.map(exports.cardListToCountsVector));
const allSetsVec = (0, function_1.pipe)(allSets, RA.map(exports.cardListToCountsVector));
/**
 * XXX: Possibly not needed.
 * Convert a list of cards to a vector of 53 indicators.
 * 1 if the card is in the list, 0 otherwise.
 * @param cardList
 * @returns
 */
// export const cardListToVector = (cardList: readonly Card[]) =>
//     RA.map((c: Card) => cardList.findIndex(card => cardsEqual(card, c)) < 0 ? 0 : 1)(allCards)
/** Get card list from counts vector
 *
 */
const countsVectorToCardList = (counts) => (0, function_1.pipe)(counts, RA.chainWithIndex((i, cnt) => {
    const cards = cnt === 0 ? [] : RA.replicate(cnt, allCards[i]);
    return cards;
}));
exports.countsVectorToCardList = countsVectorToCardList;
exports.setsArrData = RA.map(exports.cardListToCountsVector)(allSets);
/**
 *
 * @param handVec
 * @param setVec
 * @returns given hand with given set removed
 */
const handMinusSet = (handVec) => (setVec) => RA.mapWithIndex((ix, val) => handVec[ix] - val)(setVec);
exports.handMinusSet = handMinusSet;
/**
 * @param handVector
 * @param allSetsVector
 * @returns subset of given "all" sets that could be made from the given hand.
 */
const getFeasibleSets = (handVec) => RA.filter((setVec) => {
    const hms = (0, exports.handMinusSet)(handVec)(setVec);
    return R.all(i => i >= 0)(hms);
});
exports.getFeasibleSets = getFeasibleSets;
const getLifeAndRemainingCards = (handVec) => (0, function_1.pipe)(allPureSeqsVec, (0, exports.getFeasibleSets)(handVec), RA.map(life => [life, (0, exports.handMinusSet)(handVec)(life)]));
const getSecondSeqAndRemainingCards = (remainingHandVec) => (0, function_1.pipe)(allSequencesVec, (0, exports.getFeasibleSets)(remainingHandVec), RA.map(seq => [seq, (0, exports.handMinusSet)(remainingHandVec)(seq)]));
const getSetAndRemainingCards = (remainingHandVec) => (0, function_1.pipe)(allSetsVec, (0, exports.getFeasibleSets)(remainingHandVec), RA.map(set => [set, (0, exports.handMinusSet)(remainingHandVec)(set)]));
//------------------------------------------------------------------------------
// 1.
const getLife1Melds = (handVec) => {
    const lrc = getLifeAndRemainingCards(handVec);
    return lrc.length === 0 ? [[[], handVec]] : lrc;
};
exports.getLife1Melds = getLife1Melds;
// 2.
const getSeq2MeldsOpt = (life, handVec) => life.length === 0 ? [[life, [], handVec]] : (0, exports.getSeq2Melds)(life, handVec);
exports.getSeq2MeldsOpt = getSeq2MeldsOpt;
const getSeq2Melds = (life, handVec) => {
    const lrc = getSecondSeqAndRemainingCards(handVec);
    return lrc.length === 0 ? [[life, [], handVec]] : RA.map(seq => [life, seq[0], seq[1]])(lrc);
};
exports.getSeq2Melds = getSeq2Melds;
// 3.
const getSet3MeldsOpt = (life, seq1, handVec) => seq1.length === 0 ? [[life, seq1, [], handVec]] : (0, exports.getSet3Melds)(life, seq1, handVec);
exports.getSet3MeldsOpt = getSet3MeldsOpt;
const getSet3Melds = (life, seq1, handVec) => {
    const lrc = getSetAndRemainingCards(handVec);
    return lrc.length === 0 ? [[life, seq1, [], handVec]] : RA.map(seq => [life, seq1, seq[0], seq[1]])(lrc);
};
exports.getSet3Melds = getSet3Melds;
// 4.
const getFinalMeldsOpt = (life, seq1, set3, handVec) => {
    return set3.length === 0 || (0, exports.getNumCardsInVec)(handVec) < 3 ?
        [[life, seq1, set3, [], handVec]] :
        (0, exports.getFinalMelds)(life, seq1, set3, handVec);
};
exports.getFinalMeldsOpt = getFinalMeldsOpt;
const getFinalMelds = (life, seq1, set3, handVec) => {
    const lrc = getSetAndRemainingCards(handVec);
    return lrc.length === 0 ? [[life, seq1, set3, [], handVec]] : RA.map(seq => [life, seq1, set3, seq[0], seq[1]])(lrc);
};
exports.getFinalMelds = getFinalMelds;
//------------------------------------------------------------------------------
//==========================================================================================
/**
  * Possible algorithm for checking potential winning hand:
  *
  * Look for possible pure sequences of cards in the hand. Sorting by suit and and rank should help
  *
  * For each Suit,
  *
  * The 12 possible pure 3-sequences are:
  * A23, 234, 345, 456, 567, 678, 789, 89J, 9TJ, TJQ, JQK, QKA
  *
  * The 11 pure 4-sequences are:
  * A234, 2345, 3456, 4567, 5678, 6789, 789T, 89TJ, 9TJQ, TJQK, JQKA
  *
  * The 10 pure 5-sequences are:
  * *Filled by Copilot. cool!*
  * A2345, 23456, 34567, 45678, 56789, 6789T, 789TJ, 89TJQ, 9TJQK, TJQKA
  *===============================================================================================
  * The 13 + 12 = 25 possible 3-sequences with 1 joker are:
  * 13 pairs
  * 12 pure 3-aeq with middle card missing
  *
  * The 13 possible 3-sequences with 2 jokers are:
  * 13 singles
  *--------------------------------------------------------------------------------------------
  * The (12 + 11*2)= 34 4-sequences with 1 joker are:
  * 12 pure 3-sequences
  * 11 pure 4-seq with any one of 2 middle cards missing
  *
  *
  * The (25+11)=36 4-sequences with 2 joker are:
  * 25 3-sequences with 1 joker
  * 11 pure 4-seq with two of 2 middle cards missing
  *
  * The 13 4-sequences with 3 joker are:
  * A,   2,   3,   4,   5,   6,   7,   8,   9,   T,   J,   Q,   K
  *--------------------------------------------------------------------------------------------
  * The (11+ 3*10)= 41 5-sequences with 1 joker are:
  * 11 pure 4-seq
  * 10 pure 5-seq with any one middle card out of 3 missing . 3 ways to do this
  *
  *
  * The (34 + 10*30)=64 5-sequences with 2 joker are:
  * 34 4-seq with 1 joker
  * 10 pure 5-seq with any 2 of 3 missing (3C2 = 3)
  *
  * The (13 + 12 + 36+ 10)=71 5-sequences with 3 joker are:
  * 36 4-seq with 2 joker
  * 10 pure 5-seq with any 3 of 3 missing (1 way)
  *
  * The 13 5-sequences with 4 joker are:
  * 13 singles
  *
  *--------------------------------------------------------------------------------------------
  * Above repeated for each suit
  * 1372 sequences total
  * =============================================================================================
  * 4 pure 3-triplets
  * 1 pure quadruplet
  * 4C2=6 triplets with 1 joker
  * 4C1=4 triplets with 2 joker
  * 4C3=4 quadruplets with 1 joker
  * 4C2=6 quadruplets with 2 joker
  * 4C1=4 quadruplets with 3 joker
  * 13 * (4 + 1 + 6 + 4 +4+6+4)= 377 triplets total
  * 1372 + 377 = 1749 sets total
  * =============================================================================================
  * NOTE: sequences of 6 or more cards can be ignored,
  * since the 3 extra cards can always be made into their own
  * sequence. THus there is no risk of orphaning cards that could have been
  * tacked on to the end ofanother sequence
  *
  * We can check for each of the above 33 x 4 (suits) = 132 sequences in the hand.
  * If none found, return with error "No pure sequence (life) found"
  * Else continue.
  *
  * For each pure 3/4/5-sequence found,
  * check  if at least one other sequence with or without joker
  * can be made from the remaining cards.
  * If not found, return with error "No second sequence found"
  * Else continue searching remaining cards
  * for each potential life and 2nd-sequence discovered
  *
  * Look for 3/4/5-sequences with or without joker or
  * triplets/quadruplets with or without joker
  *
  * High level algorithm:
  * For each posible pure 3/4/5-sequence,
  *   For each other 3/4/5-sequence with or without joker
  *      For each other 3/4/5-sequence or triplet/quadruplet with or without joker
  *         if less than 3 cards left, fail
  *        else if remaining cards make a valid sequence wowj, or triplet/quadruplet wowj
  *             return success
  *
  * Helper functions:
  * - Partition hand by suit (for sequence checking).  sort within suit by rank
  *   Jokers should a "suit" of their own.
  * - Partition hand by rank (for triplets)
  * - check for sequence
  *   diff
  *   if sum of diffs is <= numJokers, return true
  * - check for triplet within rank
  *   if numDistinctSuits + numJokers is >= 3, return true
  *
  * More detailed algorithm:
  * const lifePlusRests: [[life, rest]] = getLifes(hand);
  * error if no life found
  * const lifeSeq2Rests: [[left, seq2, rest]] = map(getSequences(rest), lifePlusRests)
  * error if no seq2 found
  * const lifeSeq2Set3Rests: [[left, seq2, set3, rest]] = \
  *       map(geSequences(rest), lifeSeq2Rests) +
  *       map(getTriplets(rest), lifeSeq2Rests)
  * error if no set3 found
  * If rest is empty, return success
  * if validSequence(rest), return success
  * If validTriplet(rest), return success
  * else return error
  *
  *
  * error if no set4 found
  * success!
  *
  * getLifes
  *   filter out jokerts and calle getSequences
  *
  * getSequences(hand, wantPure?)
  *   const [cRanks, dRanks, hRanks, sRanks, jokers] = partitionBySuit(hand);
  *   usableJokers = wantPure ? [] : jokers;
  *   allRankSeqs =
  *     getRankSequences(cRanks, usableJokers) +
  *     getRankSequences(dRanks, usableJokers) +
  *     getRankSequences(hRanks, usableJokers) +
  *     getRankSequences(sRanks, usableJokers)
  *   return map(toSequence, allRankSeqs)
  *
  * getTriplets(hand)
  *  const partition = partitionByRank(hand);
  *
  * getRankSequences(ranks, jokers)
  *   ordinals = map(rankToOrdinal, ranks)
  *
  */
/**
 * Check if this is a winning hand.
 * TODO: Implement. Some pointers in links below.
 * https://stackoverflow.com/questions/51225335/determine-if-an-indian-rummy-hand-is-a-winning-hand-java
 * http://pds2.egloos.com/pds/200611/17/89/solving%20rummikub%20problems%20by%20integer%20linear%20programming.pdf
 * Rules:
 * At least
 * @param wcJoker: Card
 * @param hand: Hand - The hand to check
 * @returns melded hand if it is a winning hand, error otherwise
 */
function checkIfWinningHand(wcJoker, hand) {
    return E.left(new Error("Not Implemented Yet"));
}
exports.checkIfWinningHand = checkIfWinningHand;
//==========================================================================================
// eslint-disable-next-line functional/no-expression-statement
console.timeEnd("solving");
// eslint-disable-next-line functional/no-expression-statement
console.time('setsArr');
//const setsArr = new V.NDArray(setsArrData, { dtype: 'int8' });
// eslint-disable-next-line functional/no-expression-statement
console.timeEnd("setsArr");
//const slice = setsArr.slice(0, 1).toString()
const testHand = RA.map(card_1.strToCard)([
    'CA', 'C2', 'C3',
    'C7', 'D8', 'H7', 'SA',
    'HT', 'HJ', 'HQ',
    'D8', 'DT', 'DK'
]);
const handVec = (0, exports.cardListToCountsVector)(testHand);
// eslint-disable-next-line functional/no-expression-statement
//debug(`testHand: ${JSON.stringify(handVec)}`);
const printableCardLists = (0, function_1.pipe)(exports.setsArrData, (0, exports.getFeasibleSets)(handVec), RA.map((0, function_1.flow)(exports.countsVectorToCardList, RA.map(card_1.cardToJSON))));
const wcj = (0, card_1.mkCard)(types_1.Suit.Diamonds, types_1.Rank.Ace);
const allWinningMelds = (0, function_1.pipe)(handVec, exports.getLife1Melds, RA.chain((lr) => (0, exports.getSeq2MeldsOpt)(...lr)), RA.chain((lsr) => (0, exports.getSet3MeldsOpt)(...lsr)), RA.chain((lssr) => (0, exports.getFinalMeldsOpt)(...lssr)), RA.map(setsVec => (0, meld_1.mkMeldFromSetVecs)(wcj, ...setsVec)), 
// RA.filter(meld =>
//     pipe(
//         meld.looseCards,
//         RA.filter(c => !isJoker(wcj)(c)),
//     ).length === 0),
RA.map(meld_1.meldToJSON));
// eslint-disable-next-line functional/no-expression-statement
debug(`allMelds: ${JSON.stringify(allWinningMelds.length)}`);
// eslint-disable-next-line functional/no-expression-statement
debug(`allMelds: ${JSON.stringify(allWinningMelds, null, 4)}`);
// const lrc = getLifeAndRemainingCards(handVec)
// // eslint-disable-next-line functional/no-expression-statement
// //debug(`lrc: ${JSON.stringify(lrc)}`);
// const [life, remainingCards] = lrc[0];
// // eslint-disable-next-line functional/no-expression-statement
// debug(`life: ${pipe(
//     life,
//     countsVectorToCardList,
//     mkLife,
//     ilifeToJSON,
//     JSON.stringify
// )}`);
// const s2rc = getSecondSeqAndRemainingCards(remainingCards)
// const [seq2, rem2] = s2rc[0];
// // eslint-disable-next-line functional/no-expression-statement
// debug(`seq2: ${pipe(
//     seq2,
//     countsVectorToCardList,
//     cl => mkSequence(cl[0].suit, cl, mkCard(Suit.Diamonds, Rank.Ace)),
//     iseqToJSON,
//     JSON.stringify
// )}`);
// // eslint-disable-next-line functional/no-expression-statement
// debug(`rem2: ${pipe(
//     rem2,
//     countsVectorToCardList,
//     RA.map(cardToJSON),
//     JSON.stringify
// )}`);
