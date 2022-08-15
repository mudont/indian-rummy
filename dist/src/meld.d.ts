import { Card, Hand, IGame, ILife, IMeldedHand, ISequence, ITriplet, Rank, Suit } from "./types";
import * as E from "fp-ts/lib/Either";
/**
 * Get list of cards in a sequence
 * @param {ISequence} seq
 * @returns Card[]
 */
export declare function cardsInSequence(seq: ISequence | ILife): readonly Card[];
/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
export declare function cardsInTriplet(trip: ITriplet): readonly Card[];
/** Make ISequence out of given cards.
 * Caller needs to specify the suit of the sequence (in case they are all jokers)
 *
 */
export declare function mkLife(cards: readonly Card[]): ILife;
/** Make ISequence out of given cards.
 * Caller needs to specify the suit of the sequence (in case they are all jokers)
 *
 */
export declare function mkSequence(suit: Suit, cards: readonly Card[], wcj: Card): ISequence;
/** Make ITriplet out of given cards.
 * Caller needs to specify the Rank of the triplet (in case they are all jokers)
 *
 */
export declare function mkTriplet(rank: Rank, cards: readonly Card[], wcj: Card): ITriplet;
export declare const isTriplet: (cs: readonly Card[]) => boolean;
export declare function mkMeldFromSetVecs(wcj: Card, lifeVec: readonly number[], seq1Vec: readonly number[], set3Vec: readonly number[], set4Vec: readonly number[], looseCardsVec: readonly number[]): IMeldedHand;
export declare const mkNominalMeldedHand: (wcj: Card, hand: readonly Card[]) => IMeldedHand;
/**
 * turn ILife to a readable string
 * @param seq
 * @returns
 */
export declare const ilifeToJSON: (seq: ILife) => string;
/**
 * turn ISequence to a readable string
 * @param seq
 * @returns
 */
export declare const iseqToJSON: (seq: ISequence) => string;
/**
 * turn ISequence to a readable string
 * @param seq
 * @returns
 */
export declare const itripletToJSON: (seq: ITriplet) => string;
export declare const meldToJSON: (meld: IMeldedHand) => string;
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export declare function mkWinningHand(wcj: Card, sequences: readonly ISequence[], triplets: readonly ITriplet[]): E.Either<Error, IMeldedHand>;
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export declare function enumerateMeldedHand(meldedHand: IMeldedHand): readonly Card[];
export declare const countPointsOfCards: (wcj: Card, cards: readonly Card[]) => number;
export declare const computePoints: (wcj: Card) => (meld: Omit<IMeldedHand, 'points'>) => number;
/**
 * This should be in game.ts
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
export declare function computePointsGamePlayer(game: IGame, playerIdx: number): number;
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
export declare function meldedHandMatchesHand(meldedHand: IMeldedHand, hand: Hand): boolean;
