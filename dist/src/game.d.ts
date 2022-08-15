import { Card, CreateGameInput, Deck, GameRestricted, IGame, ILife, IMove, IPlayer, ISequence, ITriplet, Rank, UserId } from "./types";
import * as E from "fp-ts/lib/Either";
import * as IOE from "fp-ts/lib/IOEither";
/************************************************************
 * Core Game functions
 ************************************************************/
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
 * Make a Player
 * @param user
 * @returns
 */
export declare function newPlayer(wcj: Card, user: UserId, hand: readonly Card[]): IPlayer;
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
 * Find size of gaps that prevent foming a sequence from a sorted array of numbers.
 * Array of consecutive numbers will produce all zeros.
 * @param ns: readonly number[]. array of numbers
 * @returns readonly number[]. Size of gaps in consecurtive numbers
 */
export declare function sequenceGaps(ns: readonly number[]): readonly number[];
export declare function removeDups(ns: readonly number[]): readonly number[];
export declare function getRankSequences(ranks: readonly Rank[], maxJokers: number): readonly Rank[];
