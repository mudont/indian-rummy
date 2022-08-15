import { Card, Hand, IMeldedHand, Rank, Suit } from './types';
import * as E from "fp-ts/lib/Either";
declare type Seq = readonly Card[];
/**
 * Make all possible pure sequences of given length for given suit
 */
export declare const mkSeqs: (suit: Suit, nCards: number, seqLen: number, firstCanBeLast: boolean) => readonly Seq[];
/**
 * Leave this suit out from all suits.
 * @param suit
 * @returns
 */
export declare const getAllButThisSuit: (suit: Suit) => readonly Suit[];
/**
 * Make all possible triplets for given rank
 * @param rank
 * @returns
 */
export declare const mkTriplets: (rank: Rank) => readonly (readonly Card[])[];
/**
 * Make all possible quadruplets (just one actually) for given rank
 * @param rank
 * @returns
 */
export declare const mkQuadruplets: (rank: Rank) => readonly (readonly Card[])[];
export declare const allPureSeqs3: readonly Seq[];
export declare const allPureSeqs4: readonly Seq[];
export declare const allPureSeqs5: readonly Seq[];
export declare const allPureSeqs: readonly Seq[];
export declare const getNumCardsInVec: (vec: readonly number[]) => number;
export declare const allPureTriplets: readonly (readonly Card[])[];
export declare const getCardCounts: (cardList: readonly Card[]) => {
    [index: string]: number;
};
/**
 * Convert a list of cards to a vector of 53 counts.
 * numInstances if the card is in the list, 0 otherwise.
 * @param cardList
 * @returns
 */
export declare const cardListToCountsVector: (cardList: readonly Card[]) => readonly number[];
/**
 * XXX: Possibly not needed.
 * Convert a list of cards to a vector of 53 indicators.
 * 1 if the card is in the list, 0 otherwise.
 * @param cardList
 * @returns
 */
/** Get card list from counts vector
 *
 */
export declare const countsVectorToCardList: (counts: readonly number[]) => readonly Card[];
export declare const setsArrData: readonly (readonly number[])[];
/**
 *
 * @param handVec
 * @param setVec
 * @returns given hand with given set removed
 */
export declare const handMinusSet: (handVec: readonly number[]) => (setVec: readonly number[]) => readonly number[];
/**
 * @param handVector
 * @param allSetsVector
 * @returns subset of given "all" sets that could be made from the given hand.
 */
export declare const getFeasibleSets: (handVec: readonly number[]) => <B extends readonly number[]>(bs: readonly B[]) => readonly B[];
declare type LifeAndRest = readonly [readonly number[], readonly number[]];
declare type LifeSeqAndRest = readonly [readonly number[], readonly number[], readonly number[]];
declare type LifeSeqSetAndRest = readonly [readonly number[], readonly number[], readonly number[], readonly number[]];
declare type FinalMeldVec = readonly [readonly number[], readonly number[], readonly number[], readonly number[], readonly number[]];
export declare const getLife1Melds: (handVec: readonly number[]) => readonly LifeAndRest[];
export declare const getSeq2MeldsOpt: (life: readonly number[], handVec: readonly number[]) => readonly LifeSeqAndRest[];
export declare const getSeq2Melds: (life: readonly number[], handVec: readonly number[]) => readonly LifeSeqAndRest[];
export declare const getSet3MeldsOpt: (life: readonly number[], seq1: readonly number[], handVec: readonly number[]) => readonly LifeSeqSetAndRest[];
export declare const getSet3Melds: (life: readonly number[], seq1: readonly number[], handVec: readonly number[]) => readonly LifeSeqSetAndRest[];
export declare const getFinalMeldsOpt: (life: readonly number[], seq1: readonly number[], set3: readonly number[], handVec: readonly number[]) => readonly FinalMeldVec[];
export declare const getFinalMelds: (life: readonly number[], seq1: readonly number[], set3: readonly number[], handVec: readonly number[]) => readonly FinalMeldVec[];
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
export declare function checkIfWinningHand(wcJoker: Card, hand: Hand): E.Either<Error, IMeldedHand>;
export {};
