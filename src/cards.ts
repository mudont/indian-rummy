import assert from "assert";
import * as R from "ramda";
import Dbg from "debug";
const debug = Dbg("app:cards");
export const GAMES: IGame[] = [];
const MIDDLE_DROP_POINTS = 50;
const INITIAL_DROP_POINTS = 25;
const FULL_COUNT_POINTS = 80;

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

type NonJokerSuit = Omit<Suit, Suit.Joker>;
type NonJokerRank = Omit<Rank, Rank.One>;
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
export type RestrictedPlayer = Omit<IPlayer, "hand"|"meld">
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
type IMove = IMoveSimple | IMoveShow | IMoveReturnCard | IMoveMeld;
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
 
export type GameRestricted = Omit<IGame, "deck" | "players"> & {
  myHand?: Hand;
  myMeld?: IMeldedHand;
  players: RestrictedPlayer[];
};

//-------------------------------=============================================
/**
 *
 * @param game
 * @returns a function that takes a card and determines if that card is a joker for this game
 */
const isJoker =
  (game: GameRestricted) =>
  (card: Card): boolean =>
    card === game.currJoker || card.suit === Suit.Joker;

/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
const getRankOrdinal = (rank: Rank): number => {
  return Object.values(Rank).indexOf(rank);
};
/**
 * Check if given generic array has duplicate elements
 * @param array
 * @returns
 */
function hasDuplicates(array: any[]): boolean {
  return new Set(array).size !== array.length;
}
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
export function getRandomCard(): string {
  const suits = Array.from("CDHS");
  const ranks = Array.from("A23456789TJQK");
  const s = suits[Math.floor(Math.random() * suits.length)];
  const r = ranks[Math.floor(Math.random() * ranks.length)];

  return s + r;
}

/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
export function makeCard(cardStr: string): Card {
  assert(cardStr.length === 2);
  return new Card(cardStr[0] as Suit, cardStr[1] as Rank);
}
export const deserializeCard = makeCard;

export const gamePlayersLens = R.lens(R.prop('players')<any>, R.assoc('players'))
/**
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
function getRestrictedView(game: IGame, playerIdx: number) {
  const restrictedPlayers = R.map(R.omit(["hand", "meld"]))(game.players)
  const limitedGame = R.set(gamePlayersLens, restrictedPlayers, game);
  const gameRestricted: GameRestricted = R.omit(
    ["deck"],
    limitedGame as GameRestricted
  );

  gameRestricted["myHand"] = playerIdx >= 0 ? game.players[playerIdx].hand : undefined;
  gameRestricted["myMeld"] = playerIdx >= 0 ? game.players[playerIdx].meld : undefined;
  return gameRestricted;
}

/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param game
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
export function makeSequence(
  game: GameRestricted,
  cards: Card[]
): ISequence | Error {
  const numCards = cards.length;
  if (numCards < 3) {
    return Error("Too Few Cards");
  }
  const nonJokers = cards.filter(isJoker(game));
  const numJokers = numCards - nonJokers.length;

  if (!R.all((a: Card) => a.suit === nonJokers[0].suit)(nonJokers)) {
    return Error("Sequence can't have different suits");
  }

  if (nonJokers.length === 0) {
    return { suit: Suit.Joker, ranks: [], numJokers: cards.length };
  }
  nonJokers.sort((a, b) => getRankOrdinal(a.rank) - getRankOrdinal(b.rank));
  const ranks = nonJokers.map((c) => c.rank);
  const ordinals = ranks.map(getRankOrdinal);
  //debug(`DBG ordinals = ${JSON.stringify(ordinals)}`);
  if (
    nonJokers[0].rank === Rank.Ace &&
    getRankOrdinal(nonJokers[1].rank) > numJokers + 1
  ) {
    // Move Ace to end
    ordinals.splice(0, 1);
    ordinals.push(13);
    const rankArr = ranks.splice(0, 1);
    ranks.push(rankArr[0]);

    const aceArr = nonJokers.splice(0, 1);
    nonJokers.push(aceArr[0]);
  }

  let usableJokers = numJokers;
  for (let i = 0; i < nonJokers.length - 1; i++) {
    //debug(`DBG ${ordinals[i + 1] - ordinals[i]} > ${usableJokers + 1}`);
    if (ordinals[i + 1] - ordinals[i] > 1 + usableJokers) {
      return Error("Can't make a sequence with these ranks");
    }
    usableJokers -= ordinals[i + 1] - ordinals[i] - 1;
  }
  return { suit: nonJokers[0].suit, ranks, numJokers };
}
/**
 * Make a Triplet from given cards in context of game
 * @param game
 * @param cards
 * @returns ITriplet or Error
 */
export function makeTriplet(
  game: GameRestricted,
  cards: Card[]
): ITriplet | Error {
  const numCards = cards.length;
  if (numCards < 3 || numCards > 4) {
    return Error("Triplet must have 3 or 4 Cards");
  }
  const nonJokers = cards.filter(isJoker(game));
  const numJokers = numCards - nonJokers.length;

  if (nonJokers.length === 0) {
    return { rank: Rank.Two, suits: [], numJokers: cards.length };
  }
  nonJokers.sort((a, b) => getRankOrdinal(a.rank) - getRankOrdinal(b.rank));
  const suits = nonJokers.map((c) => c.suit);
  if (hasDuplicates(suits)) {
    return Error("Triplet must have different suits");
  }
  const ordinals = cards.map((c) => getRankOrdinal(c.rank));

  for (let i = 0; i < nonJokers.length - 1; i++) {
    //debug(`DBG ${ordinals[i + 1] - ordinals[i]} > ${usableJokers + 1}`);
    if (ordinals[i + 1] - ordinals[i] !== 0) {
      return Error("Triplet must have one rank");
    }
  }
  return { rank: nonJokers[0].rank, suits, numJokers };
}

/**
 * Make a Life - a sequence without jokers
 * @param game
 * @param cards
 * @returns
 */
export function makeLife(game: GameRestricted, cards: Card[]): ILife | Error {
  const seq = makeSequence(game, cards);
  if (seq instanceof Error) return seq;
  if (seq.numJokers > 0) {
    return Error(`Life sequence cannot have jokers`);
  }
  return R.omit(["numJokers"], seq);
}

/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export function makeMeldedHand(
  sequences: ISequence[],
  triplets: ITriplet[]
): IMeldedHand | Error {
  if (sequences.length < 2) {
    return Error(`Need at least two sequences`);
  }
  const life = R.find((s) => s.numJokers === 0, sequences);
  if (!life) {
    return Error(`Need a Life`);
  }
  let numCards = 0;
  sequences.forEach((s) => {
    numCards += s.ranks.length;
    numCards += s.numJokers;
  });

  if (numCards !== 13) {
    return Error(`Need 13 cards. have ${numCards}`);
  }
  return {
    life,
    triplets,
    sequences: sequences.filter((s) => s.numJokers > 0),
  };
}
/**
 * sum array of numbers
 */
const sum = R.reduce((tot: number, elem: number) => tot + elem, 0);
function cardsInSequence(seq: ISequence | ILife): Card[] {
  return R.map((r: NonJokerRank) => new Card(seq.suit as Suit, r as Rank))(
    seq.ranks
  );
}
/**
 * Set difference
 * @param a
 * @param b
 * @returns
 */
function setDiff<T>(a: Set<T>, b: Set<T>) {
  return new Set(Array.from(a).filter((item) => !b.has(item)));
}
/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip: ITriplet): Card[] {
  return R.map((s: NonJokerSuit) => new Card(s as Suit, trip.rank))(trip.suits);
}

/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export function enumerateMeldedHand(meldedHand: IMeldedHand): Card[] {
  const jokers = R.repeat(
    new Card(Suit.Joker, Rank.One),
    sum(R.map(R.prop("numJokers"), meldedHand.triplets ?? [])) +
      sum(R.map(R.prop("numJokers"), meldedHand.sequences ?? []))
  );
  // If no life only Jokers can be used to save points
  if (!meldedHand.life) {
    return jokers;
  }
  const lifeCards = meldedHand.life ? cardsInSequence(meldedHand.life) : [];
  const sequenceCards = R.flatten(
    R.map(cardsInSequence, meldedHand.sequences ?? [])
  );
  // If no second sequence after Life,
  // can't use triplets to save points
  if (sequenceCards.length <= 0) {
    return jokers.concat(lifeCards);
  }
  const tripleCards = R.flatten(
    R.map(cardsInTriplet, meldedHand.triplets ?? [])
  );
  return jokers.concat(lifeCards, sequenceCards, tripleCards);
}
/**
 * get Points for Card
 * @param c
 * @returns
 */
function pointsOfCard(c: Card): number {
  if ([Rank.Ace, Rank.King, Rank.Queen, Rank.Jack].includes(c.rank)) {
    return 10;
  } else {
    return getRankOrdinal(c.rank);
  }
}
/**
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
export function computePoints(game: IGame, playerIdx: number): number {
  if (game.players[playerIdx].status === PlayerStatus.Won) {
    return 0;
  }
  const cardsToCount = setDiff(
    new Set(game.players[playerIdx].hand),
    new Set(enumerateMeldedHand(game.players[playerIdx].meld))
  );
  return Math.min(
    FULL_COUNT_POINTS,
    sum(R.map(pointsOfCard)(Array.from(cardsToCount)))
  );
}
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
export function meldedHandMatchesHand(
  meldedHand: IMeldedHand,
  hand: Hand
): boolean {
  return new Set(hand) === new Set(enumerateMeldedHand(meldedHand));
}
/**
 * Make a Player
 * @param user
 * @returns
 */
export function newPlayer(user: UserId): IPlayer {
  return { user, status: PlayerStatus.Active, points: 0, moved: false, hand: [], meld:{}};
}

/**
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
export function makeGame(
  playerIds: UserId[],
  currUser: UserId
): GameRestricted {
  const numPlayers: number = playerIds.length;
  const minCards = numPlayers * 13 + 10;
  const nDecks = Math.ceil(minCards / 54);
  const decks = [];
  for (let i = 0; i < nDecks; i++) {
    decks.push(makeDeck());
  }
  const mergedDeck = mergeDecks(decks);
  const [usedDeck, hands, openCard, joker] = dealFromDeck(
    mergedDeck,
    numPlayers,
    13
  );
  const players = R.map((u) => newPlayer(u), playerIds);
  const id = GAMES.length;
  const game = {
    id,
    state: GameState.Active,
    deck: usedDeck,
    hands,
    melds: [],
    openPile: [openCard],
    currJoker: joker,
    players,
    turnPlayer: players[0],
    moves: [],
  };
  GAMES.push(game);
  const userIdx = R.findIndex(R.propEq("user", currUser), game.players);
  return getRestrictedView(game, userIdx);
}

/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */
export function makeDeck(): Deck {
  const deck: Deck = [];

  for (const s of Object.values(Suit)) {
    if (s === Suit.Joker) {
      // Two Jokers
      deck.push(new Card(Suit.Joker, Rank.One));
      deck.push(new Card(Suit.Joker, Rank.One));
      continue;
    }
    for (const r of Object.values(Rank)) {
      if (r !== Rank.One) {
        const card: Card = new Card(s, r);
        deck.push(card);
      }
    }
  }
  return deck;
}

/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
export const shuffleDeck = (deck: Deck): Deck => {
  return deck
    .map((value) => ({ value, randKey: Math.random() }))
    .sort((a, b) => a.randKey - b.randKey)
    .map(({ value }) => value);
};

/**
 * Combines given decks into one
 * @param decks
 * @returns
 */
export const mergeDecks = (decks: Deck[]): Deck => {
  const d: Deck = [];
  return d.concat(...decks);
};

/**
 * Shuffle given and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
export const dealFromDeck = (
  deck: Deck,
  numPlayers: number,
  handSize = 13
): [Deck, Card[][], Card, Card] => {
  assert(deck.length > numPlayers * handSize + 2);
  const shuffled = shuffleDeck(deck);
  debug(`shuffled: ${JSON.stringify(shuffled)}`);
  const hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(shuffled.splice(0, handSize));
  }
  const openCardArr = shuffled.splice(0, 1);
  const jokerArr = shuffled.splice(0, 1);
  return [shuffled, hands, openCardArr[0], jokerArr[0]];
};

/**
 * Is player status final?
 * @param p
 * @returns
 */
export function playerFinished(p: IPlayer): boolean {
  return (
    p.status === PlayerStatus.Dropped ||
    p.status === PlayerStatus.Won ||
    p.status === PlayerStatus.Lost
  );
}
/**
 * Make a Rummy move. this is the only way for a Rummy game can change state
 * @param gameId
 * @param user
 * @param move
 * @returns
 */
export function makeMove(
  gameId: number,
  user: UserId,
  move: IMove
): GameRestricted | Error {
  const game = GAMES[gameId];
  if (!game) {
    return Error(`Invalid Game id ${gameId}`);
  }
  if (game.state === GameState.Finished) {
    return Error(`Game ${gameId} is finished`);
  }
  const playerIdx: number | undefined = R.findIndex(
    R.propEq("user", user),
    game.players
  );
  if (!playerIdx) {
    return Error("user is not a player");
  }
  const player: IPlayer = game.players[playerIdx];
  if (playerFinished(player)) {
    return Error("Player status doesn't allow any moves");
  }
  if (
    player.status === PlayerStatus.OwesCard &&
    move.moveType !== MoveType.ReturnExtraCard
  ) {
    return Error("Player must return extra card before doing anything else");
  }
  switch (move.moveType) {
    case MoveType.Drop:
      player.points = player.moved ? MIDDLE_DROP_POINTS : INITIAL_DROP_POINTS;
      break;

    case MoveType.TakeOpen:
      // XXX TODO handle edge cases
      if (game.openPile.length === 0) {
        return Error("No Open cards yet");
      }
      game.players[playerIdx].hand.push(game.openPile.splice(-1, 1)[0]);
      player.status = PlayerStatus.OwesCard;
      break;

    case MoveType.TakeFromDeck:
      game.players[playerIdx].hand.push(game.deck.splice(0, 1)[0]);
      player.status = PlayerStatus.OwesCard;
      if (game.deck.length === 0) {
        // Deck has run out
        // Take all open cards but the top one, shuffle, and use them as deck
        const tmp = game.openPile.splice(-1, 1);
        game.deck = shuffleDeck(game.openPile);
        game.openPile = tmp;
      }
      break;

    case MoveType.ReturnExtraCard:
      if (move.cardDiscarded) {
        game.openPile.push(move.cardDiscarded);
      } else {
        return Error("No card returned");
      }
      game.players[playerIdx].hand = game.players[playerIdx].hand.filter(
        (c) => c !== move.cardDiscarded
      );
      player.status = PlayerStatus.Active;
      break;

    case MoveType.Meld:
      if (
        setDiff(
          new Set(enumerateMeldedHand(move.meldedHand)),
          new Set(game.players[playerIdx].hand)
        ).size > 0
      ) {
        return Error("Meld contains cards not in your Hand");
      }
      game.players[playerIdx].meld = move.meldedHand;
      break;

    case MoveType.Show:
      if (!meldedHandMatchesHand(move.meldedHand, game.players[playerIdx].hand)) {
        return Error("Wrong Show");
      }
      game.players.forEach((p) => {
        p.status = PlayerStatus.Lost;
      });
      player.status = PlayerStatus.Won;
      break;
    case MoveType.Finish:
      game.players.forEach((p, idx) => {
        p.points = computePoints(game, idx);
      });
      game.state = GameState.Finished;
      break;
    default:
      return Error("Unknown move type");
      //break;
  }
  game.moves.push(move);
  player.moved = true;
  return getRestrictedView(game, playerIdx);
}