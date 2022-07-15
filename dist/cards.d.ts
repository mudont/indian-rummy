import * as R from "ramda";
export declare const GAMES: IGame[];
export declare enum Suit {
    Clubs = "C",
    Diamonds = "D",
    Hearts = "H",
    Spades = "S",
    Joker = "J"
}
export declare enum Rank {
    Ace = "A",
    One = "1",
    Two = "2",
    Three = "3",
    Four = "4",
    Five = "5",
    Six = "6",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Ten = "T",
    Jack = "J",
    Queen = "Q",
    King = "K"
}
export declare enum PlayerStatus {
    Active = 0,
    OwesCard = 1,
    Dropped = 2,
    Won = 3,
    Lost = 4
}
export declare enum MoveType {
    Drop = 0,
    TakeOpen = 1,
    TakeFromDeck = 2,
    ReturnExtraCard = 3,
    Meld = 4,
    Show = 5,
    Finish = 6
}
export declare class Card {
    suit: Suit;
    rank: Rank;
    constructor(s: Suit, r: Rank);
    toJSON(): string;
    serialize(): string;
}
export declare type UserId = string;
export declare type Hand = Card[];
declare type NonJokerSuit = Omit<Suit, Suit.Joker>;
declare type NonJokerRank = Omit<Rank, Rank.One>;
export interface ISequence {
    suit: NonJokerSuit;
    ranks: NonJokerRank[];
    numJokers: number;
}
export interface ILife {
    suit: NonJokerSuit;
    ranks: NonJokerRank[];
}
export interface ITriplet {
    rank: Rank;
    suits: NonJokerSuit[];
    numJokers: number;
}
export interface IMeldedHand {
    life?: ILife;
    triplets?: ITriplet[];
    sequences?: ISequence[];
}
export declare type Pile = Card[];
export declare type Deck = Card[];
export interface IPlayer {
    user: UserId;
    status: PlayerStatus;
    points: number;
    moved: boolean;
    hand: Hand;
    meld: IMeldedHand;
}
export declare type RestrictedPlayer = Omit<IPlayer, "hand" | "meld">;
export interface IMoveSimple {
    moveType: MoveType.Drop | MoveType.TakeFromDeck | MoveType.TakeOpen | MoveType.Finish;
    player: UserId;
}
export interface IMoveShow {
    moveType: MoveType.Show;
    player: UserId;
    meldedHand: IMeldedHand;
}
export interface IMoveMeld {
    moveType: MoveType.Meld;
    player: UserId;
    meldedHand: IMeldedHand;
}
export interface IMoveReturnCard {
    moveType: MoveType.ReturnExtraCard;
    player: UserId;
    cardDiscarded: Card;
}
declare type IMove = IMoveSimple | IMoveShow | IMoveReturnCard | IMoveMeld;
export declare enum GameState {
    Active = 0,
    Finished = 1
}
/**
 * Represents a Rummy game
 */
export interface IGame {
    id: number;
    state: GameState;
    deck: Deck;
    openPile: Card[];
    currJoker: Card;
    turnPlayer: IPlayer;
    players: IPlayer[];
    moves: IMove[];
}
export declare type GameRestricted = Omit<IGame, "deck" | "players"> & {
    myHand?: Hand;
    myMeld?: IMeldedHand;
    players: RestrictedPlayer[];
};
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
export declare function getRandomCard(): string;
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
export declare function makeCard(cardStr: string): Card;
export declare const deserializeCard: typeof makeCard;
export declare const gamePlayersLens: R.Lens<Record<"players", unknown> & Omit<unknown, "players">, any>;
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
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */
export declare function makeDeck(): Deck;
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
export declare const shuffleDeck: (deck: Deck) => Deck;
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */
export declare const mergeDecks: (decks: Deck[]) => Deck;
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
export {};
