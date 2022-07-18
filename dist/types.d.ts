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
export declare type NonJokerSuit = Omit<Suit, Suit.Joker>;
export declare type NonJokerRank = Omit<Rank, Rank.One>;
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
export declare type IMove = IMoveSimple | IMoveShow | IMoveReturnCard | IMoveMeld;
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
