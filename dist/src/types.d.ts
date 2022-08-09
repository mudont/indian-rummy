import * as IOE from "fp-ts/lib/IOEither";
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
export interface Card {
    readonly suit: Suit;
    readonly rank: Rank;
}
export declare type UserId = string;
export declare type Hand = ReadonlyArray<Card>;
export declare type NonJokerSuit = Omit<Suit, Suit.Joker>;
export declare type NonJokerRank = Omit<Rank, Rank.One>;
export interface ISequence {
    readonly suit: NonJokerSuit;
    readonly ranks: readonly NonJokerRank[];
    readonly numJokers: number;
}
export interface ILife {
    readonly suit: NonJokerSuit;
    readonly ranks: readonly NonJokerRank[];
}
export interface ITriplet {
    readonly rank: Rank;
    readonly suits: readonly NonJokerSuit[];
    readonly numJokers: number;
}
export interface IMeldedHand {
    readonly life?: ILife;
    readonly triplets?: readonly ITriplet[];
    readonly sequences?: readonly ISequence[];
}
export declare type Pile = readonly Card[];
export declare type Deck = readonly Card[];
export interface IPlayer {
    readonly user: UserId;
    readonly status: PlayerStatus;
    readonly points: number;
    readonly moved: boolean;
    readonly hand: Hand;
    readonly meld: IMeldedHand;
}
export declare type RestrictedPlayer = Omit<IPlayer, "hand" | "meld">;
export interface IMoveSimple {
    readonly moveType: MoveType.Drop | MoveType.TakeFromDeck | MoveType.TakeOpen | MoveType.Finish;
    readonly player: UserId;
}
export interface IMoveShow {
    readonly moveType: MoveType.Show;
    readonly player: UserId;
    readonly meldedHand: IMeldedHand;
}
export interface IMoveMeld {
    readonly moveType: MoveType.Meld;
    readonly player: UserId;
    readonly meldedHand: IMeldedHand;
}
export interface IMoveReturnCard {
    readonly moveType: MoveType.ReturnExtraCard;
    readonly player: UserId;
    readonly cardDiscarded: Card;
}
export declare type IMove = IMoveSimple | IMoveShow | IMoveReturnCard | IMoveMeld;
export declare enum GameState {
    Active = 0,
    Finished = 1
}
/**
 * Represents a Rummy game
 */
export interface IGame {
    readonly id: number;
    readonly state: GameState;
    readonly deck: Deck;
    readonly openPile: readonly Card[];
    readonly wcJoker: Card;
    readonly turnPlayer: UserId;
    readonly players: readonly IPlayer[];
    readonly moves: readonly IMove[];
}
export declare type CreateGameInput = Omit<IGame, "id">;
export declare type GameRestricted = Omit<IGame, "deck" | "players"> & {
    readonly myHand: Hand;
    readonly myMeld: IMeldedHand;
    readonly players: readonly RestrictedPlayer[];
};
export interface IGameStore {
    readonly createGame: (game: CreateGameInput) => IOE.IOEither<Error, IGame>;
    readonly saveGame: (game: IGame) => IOE.IOEither<Error, IGame>;
    readonly loadGame: (meId: number) => IOE.IOEither<Error, IGame>;
}
