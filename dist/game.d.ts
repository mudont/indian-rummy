import { Card, Deck, GameRestricted, Hand, IGame, ILife, IMeldedHand, IMove, IPlayer, ISequence, ITriplet, UserId } from "./types";
export declare const GAMES: IGame[];
/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param game
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
export declare function makeSequence(game: GameRestricted, cards: Card[]): ISequence | Error;
/**
 * Make a Triplet from given cards in context of game
 * @param game
 * @param cards
 * @returns ITriplet or Error
 */
export declare function makeTriplet(game: GameRestricted, cards: Card[]): ITriplet | Error;
/**
 * Make a Life - a sequence without jokers
 * @param game
 * @param cards
 * @returns
 */
export declare function makeLife(game: GameRestricted, cards: Card[]): ILife | Error;
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export declare function makeMeldedHand(sequences: ISequence[], triplets: ITriplet[]): IMeldedHand | Error;
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export declare function enumerateMeldedHand(meldedHand: IMeldedHand): Card[];
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
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
export declare function makeGame(playerIds: UserId[], currUser: UserId): GameRestricted;
/**
 * Shuffle given and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
export declare const dealFromDeck: (deck: Deck, numPlayers: number, handSize?: number) => [Deck, Card[][], Card, Card];
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
export declare function makeMove(gameId: number, user: UserId, move: IMove): GameRestricted | Error;
/**
 * Check if this is a winning hand.
 * https://stackoverflow.com/questions/51225335/determine-if-an-indian-rummy-hand-is-a-winning-hand-java
 * http://pds2.egloos.com/pds/200611/17/89/solving%20rummikub%20problems%20by%20integer%20linear%20programming.pdf
 * Rules:
 * At least
 * @param gameId
 * @param hand
 * @returns melded hand
 */
export declare function checkHand(gameId: number, hand: Hand): IMeldedHand | Error;
