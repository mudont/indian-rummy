import { Card, CreateGameInput, Deck, GameRestricted, Hand, IGame, ILife, IMeldedHand, IMove, IPlayer, ISequence, ITriplet, Rank, UserId } from "./types";
import * as E from "fp-ts/lib/Either";
import * as IOE from "fp-ts/lib/IOEither";
/************************************************************
 * Core Game functions
 ************************************************************/
/**
 * Get list of cards in a sequence
 * @param {ISequence} seq
 * @returns Card[]
 */
export declare function cardsInSequence(seq: ISequence | ILife): readonly Card[];
/**
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
export declare function mkGame(playerIds: readonly UserId[]): IOE.IOEither<Error, CreateGameInput>;
/**
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
export declare function getRestrictedView(game: IGame, playerIdx: number): E.Either<Error, GameRestricted>;
/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param wcJoker: CardI
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
export declare function mkSequence(wcJoker: Card, cards: readonly Card[]): E.Either<Error, ISequence>;
/**
 * Make a Life - a sequence without jokers
 * @param wcJoker
 * @param cards
 * @returns
 */
export declare function mkLife(wcJoker: Card, cards: readonly Card[]): E.Either<Error, ILife>;
/**
 * Make a Triplet from given cards in context of game
 * @param wcJoker
 * @param cards
 * @returns ITriplet or Error
 */
export declare function mkTriplet(wcJoker: Card, cards: readonly Card[]): E.Either<Error, ITriplet>;
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export declare function mkWinningHand(sequences: readonly ISequence[], triplets: readonly ITriplet[]): E.Either<Error, IMeldedHand>;
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export declare function enumerateMeldedHand(meldedHand: IMeldedHand): readonly Card[];
/**
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
export declare function computePoints(game: IGame, playerIdx: number): number;
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
export declare function meldedHandMatchesHand(meldedHand: IMeldedHand, hand: Hand): boolean;
/**
 * Make a Player
 * @param user
 * @returns
 */
export declare function newPlayer(user: UserId): IPlayer;
/**
 * Shuffle given deck and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
export declare const dealFromDeck: (deck: Deck, numPlayers: number, handSize?: number) => IOE.IOEither<Error, readonly [Deck, readonly (readonly Card[])[], Card, Card]>;
/**
 * Is player status final?
 * @param p
 * @returns
 */
export declare function playerFinished(p: IPlayer): boolean;
/**
 * Make a Rummy move. this is the only way for a Rummy game can change state
 * @param gameId
 * @param user
 * @param move
 * @returns
 */
export declare function mkMove(game: IGame, move: IMove): IOE.IOEither<Error, IGame>;
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
/**
 * Find size of gaps that prevent foming a sequence from a sorted array of numbers.
 * Array of consecutive numbers will produce all zeros.
 * @param ns: readonly number[]. array of numbers
 * @returns readonly number[]. Size of gaps in consecurtive numbers
 */
export declare function sequenceGaps(ns: readonly number[]): readonly number[];
export declare function removeDups(ns: readonly number[]): readonly number[];
export declare function getRankSequences(ranks: readonly Rank[], maxJokers: number): readonly Rank[];
