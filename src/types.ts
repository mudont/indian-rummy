import * as IOE from "fp-ts/lib/IOEither";

/**
 * Representation of a playing card (a Suit and a Rank) should be
 * pretty easy to see.
 * Perhaps the only thing to keep in mind is that
 * jokers are represented as Suit=Joker and Rank=1
 */
// ♣♦♥♠  ♧♢♡♤
export enum Suit {
    Clubs = "C",
    Diamonds = "D",
    Hearts = "H",
    Spades = "S",
    Joker = "J",
}

export enum Rank {
    Ace = "A",
    Joker = "1", // for Joker
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
    King = "K",
}

export enum PlayerStatus {
    Active,
    OwesCard, // State between moveTakeOpen/TakeFromDeck and the move ReturnExtraCard
    Dropped,
    Won,
    Lost,
}
// Things that a player can do to interact with the Game service
// slightly different from Turn (see comments below)
export enum MoveType {
    /**
     * Drop == Give up early and get a discount on points.
     * Drop before first move == 25 points
     * A "Middle" Drop after playing at least one move == 50
     * Worst case points if you don't drop == 80
     */
    Drop,
    TakeOpen, // Take top card from the Discarded pile, which are all laid face up
    TakeFromDeck, // Take top card from the remaining Deck, which is face down
    ReturnExtraCard, // This is technically part of TakeOpen and TakeFromDeck
    Show, // means player is claiming a win.

    // TODO: Check if we really need Meld.
    // Not technically a move, but something the Game API suppoorts
    // where a player can tell the server to store their Meld.
    Meld,
    // TODO: Is this needed/does it make sense?
    // The idea is that after a 'Show' has passed inspection by other players
    // or the computer, someone marks the Game as Finished.
    Finish,
}

export interface Card {
    readonly suit: Suit;
    readonly rank: Rank;
}
export interface Joker extends Card {
    readonly suit: Suit.Joker;
    readonly rank: Rank.Joker;
}

export type UserId = string;

export type Hand = ReadonlyArray<Card>;

export type NonJokerSuit = Omit<Suit, Suit.Joker>;
export type NonJokerRank = Omit<Rank, Rank.Joker>;

// Set is the generic name that can mean a sequence or triplet
// In the game Rummikub, a "group" is a triplet, and a "run" is a sequence
// sequence aka run
export interface ISequence {
    readonly suit: NonJokerSuit;
    readonly ranks: readonly NonJokerRank[];
    readonly numJokers: number;
}
// Life, aka Pure sequence/Pure Run
export interface ILife {
    readonly suit: NonJokerSuit;
    readonly ranks: readonly NonJokerRank[];
}
// Triplet aka Group
export interface ITriplet {
    readonly rank: Rank;
    readonly suits: readonly NonJokerSuit[];
    readonly numJokers: number;
}

export interface IMeldedHand {
    readonly life?: ILife;
    readonly triplets: readonly ITriplet[];
    readonly sequences: readonly ISequence[];
    readonly looseCards: readonly Card[];
    readonly points: number;
    readonly wcj: Card; // wild card joker
}

export type Pile = readonly Card[];

export type Deck = readonly Card[];

export interface IPlayer {
    readonly user: UserId;
    readonly status: PlayerStatus;
    readonly points: number;
    readonly moved: boolean;
    readonly hand: Hand;
    readonly meld: IMeldedHand;
}
export type RestrictedPlayer = Omit<IPlayer, "hand" | "meld">;
export interface IMoveSimple {
    readonly moveType:
    | MoveType.Drop
    | MoveType.TakeFromDeck
    | MoveType.TakeOpen
    | MoveType.Finish;
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
export type IMove = IMoveSimple | IMoveShow | IMoveReturnCard | IMoveMeld;
export enum GameState {
    Active,
    Finished,
}
/**
 * Represents a Rummy game
 */
export interface IGame {
    readonly id: number;
    readonly state: GameState;
    readonly deck: Deck;
    readonly openPile: readonly Card[];
    // Wild card joker for this game
    readonly wcJoker: Card;
    readonly turnPlayer: UserId;
    readonly players: readonly IPlayer[];
    readonly moves: readonly IMove[];
}
export type CreateGameInput = Omit<IGame, "id">;
export type GameRestricted = Omit<IGame, "deck" | "players"> & {
    readonly myHand: Hand;
    readonly myMeld: IMeldedHand;
    readonly players: readonly RestrictedPlayer[];
};

export interface IGameStore {
    readonly createGame: (game: CreateGameInput) => IOE.IOEither<Error, IGame>;
    readonly saveGame: (game: IGame) => IOE.IOEither<Error, IGame>;
    readonly loadGame: (meId: number) => IOE.IOEither<Error, IGame>;
}
