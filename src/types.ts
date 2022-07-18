import * as TE from "fp-ts/lib/TaskEither";
//import * as IOEither from "fp-ts/lib/IOEither";
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
  One = "1", // for Joker
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
  OwesCard,
  Dropped,
  Won,
  Lost,
}

export enum MoveType {
  Drop,
  TakeOpen,
  TakeFromDeck,
  ReturnExtraCard,
  Meld,
  Show,
  Finish,
}

export class Card {
  suit: Suit;
  rank: Rank;
  constructor(s: Suit, r: Rank) {
    this.suit = s;
    this.rank = r;
  }
  toJSON() {
    return this.suit + this.rank;
  }
  serialize() {
    return this.toJSON();
  }
}

export type UserId = string;

export type Hand = Card[];

export type NonJokerSuit = Omit<Suit, Suit.Joker>;
export type NonJokerRank = Omit<Rank, Rank.One>;
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

export type Pile = Card[];

export type Deck = Card[];

export interface IPlayer {
  user: UserId;
  status: PlayerStatus;
  points: number;
  moved: boolean;
  hand: Hand;
  meld: IMeldedHand;
}
export type RestrictedPlayer = Omit<IPlayer, "hand" | "meld">;
export interface IMoveSimple {
  moveType:
    | MoveType.Drop
    | MoveType.TakeFromDeck
    | MoveType.TakeOpen
    | MoveType.Finish;
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
export type IMove = IMoveSimple | IMoveShow | IMoveReturnCard | IMoveMeld;
export enum GameState {
  Active,
  Finished,
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
export type CreateGameInput = Omit<IGame, "id">;
export type GameRestricted = Omit<IGame, "deck" | "players"> & {
  myHand?: Hand;
  myMeld?: IMeldedHand;
  players: RestrictedPlayer[];
};

export interface IGameStore {
  createGame: (game: CreateGameInput) => TE.TaskEither<Error, IGame>;
  saveGame: (game: IGame) => TE.TaskEither<Error, IGame>;
  loadGame: (gameId: number) => TE.TaskEither<Error, IGame>;
}
