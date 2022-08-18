/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable functional/no-expression-statement */
import {
    mkGame,
    mkMove,
    dealFromDeck,
    mkSequence,
    mkLife,
    mkTriplet,
    getRestrictedView,
} from "../src/game";
import { setDiff } from "../src/util";
import { mkDeck, mergeDecks, mkCard } from "../src/card";
import { Card, CreateGameInput, Deck, GameRestricted, Hand, IGame, IGameStore, MoveType, Rank, Suit, UserId } from "../src/types";
import Dbg from "debug";
const debug = Dbg("app:test");
import { identity, pipe } from "fp-ts/lib/function";
import * as IO from "fp-ts/lib/IO";
import * as IOE from "fp-ts/lib/IOEither";
import * as E from "fp-ts/lib/Either";
import * as A from "fp-ts/lib/ReadonlyArray";
import * as N from "fp-ts/lib/number";
import * as C from "fp-ts/lib/Console";
import * as R from "ramda"
import MemoryStore from "../src/store";
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff';
import assert from "assert";

type Ordering = -1 | 0 | 1;
interface Eq<Card> {
    readonly equals: (a: Card, b: Card) => boolean;
    // compare(a: Card, b: Card): Ordering;
}
interface Ord<Card> extends Eq<Card> {
    readonly compare: (a: Card, b: Card) => Ordering;
}
const ordCard: Ord<Card> = {
    equals: (a, b) => a.rank === b.rank && a.suit === b.suit,
    compare: (a, b) =>
        (a.suit === b.suit) ?
            (a.rank === b.rank ? 0 : a.rank < b.rank ? -1 : 1) :
            a.suit < b.suit ? -1 : 1
}

const d1 = mkDeck(1);
const d2 = mkDeck(1);
const ds = A.sort(ordCard)(mergeDecks([d1, d2]));
//debug(`${JSON.stringify(ds)}`);
assert(ds.length === 108);

//const [remaining, hands, openCard, joker] = dealFromDeck(ds, 6, 13);
const dealRes = dealFromDeck(ds, 6, 13);
const sa = mkCard(Suit.Clubs, Rank.Ace);
const dflt: readonly [Deck, readonly (readonly Card[])[], Card, Card] =
    [mkDeck(1), [[]], sa, sa];

const deal = E.getOrElse(() => dflt)(dealRes());
// debug(`Result: ${JSON.stringify(deal)}`);
const [remaining, hands, openCard, joker] = deal;

// debug(`Result: ${remaining.length} ${hands.length} ${hands[5].length} ${openCard.rank} ${openCard.suit} ${joker.rank} ${joker.suit}`);
const reassembled = A.sort(ordCard)(A.concat(remaining)(A.concat(A.flatten(hands))([joker, openCard])))
// debug(`Reassembled: ${reassembled.length}`);
// debug(`Reassembled: ${JSON.stringify(reassembled)}`);
// debug(`ds: ${JSON.stringify(ds)}`);

// debug(`A.zip(reassembled, ds): ${A.zip(reassembled, ds).length}`);
assert(JSON.stringify(reassembled) === JSON.stringify(ds), "reassembled deck is equal to original deck");
assert(remaining.length === 108 - 6 * 13 - 1 - 1, "remaining deck is of correct size");
assert(hands.length === 6, "hands is of correct size");
assert(hands[0].length === 13, "hands[0] is of correct size");

interface IScope {
    readonly store: IGameStore
    readonly game_: CreateGameInput
    readonly game: IGame
    readonly g2: IGame
}
const myHand = (game: IGame, user: UserId): E.Either<Error, Hand> =>
    E.map<GameRestricted, Hand>(g => g.myHand)(getRestrictedView(
        game,
        R.findIndex(
            R.propEq("user", "Murali"),
            game.players
        )
    ));
const session = pipe(
    IOE.Do,
    IOE.bind('store', () => MemoryStore),
    IOE.bind('game_', () => mkGame(["Murali", "Arun", "Ramu", "Sri"])),
    IOE.bind('game', (sc => sc.store.createGame(sc.game_))),
    IOE.bind('g2', (sc) => mkMove(sc.game, { moveType: MoveType.TakeFromDeck, player: "Murali", })),
    IOE.bind('hand', (sc) => IOE.fromEither(myHand(sc.g2, "Murali"))),
    IOE.bind('g3', (sc) => mkMove(sc.g2, { moveType: MoveType.ReturnExtraCard, cardDiscarded: sc.hand[0], player: "Murali", })),
    IOE.bind('g4', (sc) => mkMove(sc.g3, { moveType: MoveType.TakeOpen, player: "Arun", })),
    IOE.bind('hand2', (sc) => IOE.fromEither(myHand(sc.g4, "Arun"))),
    IOE.bind('g5', (sc) => mkMove(sc.g4, { moveType: MoveType.ReturnExtraCard, cardDiscarded: sc.hand2[0], player: "Arun", })),
    // IOE.bind('gdiff', (sc) => IOE.right(diff(sc.game, sc.g3))),
    IOE.orElse((e) => {
        debug(`Error onLeft: ${e.message}`);
        return IOE.left(e)
    }),
    IOE.chain(sc => {
        //debug(`Should n't get here if error sc: ${Object.keys(sc)}`);
        return IOE.right(sc)
    }),
    IOE.bind('g6', (sc) => sc.store.saveGame(sc.g5))
)()

// debug(`session: ${JSON.stringify(session())}`);
// const dfltGame = {id:-1, ... mkGame(["Murali", "Arun", "Ramu", "Sri"])
const ioeGfromStore = E.fold<Error, IGameStore, IGameStore>((e) => ({ err: e.message } as unknown as IGameStore), identity)(MemoryStore()).loadGame(0);
// debug(`game: ${JSON.stringify(ioeG())}`);
const gameFromStore = E.fold<Error, IGame, IGame>((e) => ({ id: -1 } as IGame), identity)(ioeGfromStore());

debug(`game: ${JSON.stringify(gameFromStore)}`);

// debug(`game change on move: ${JSON.stringify(gdiff())}`);

// * const retrictedGame = getRestrictedView(game(), 1);
// ! const game: GameRestricted = mkGame(
// TODO  ["Murali", "Arun", "Ramu", "Sri"],
// ?  "Murali"
// );

// debug(
//   `hands=${JSON.stringify(hands)};\n\n Remaining= ${JSON.stringify(
//     remaining
//   )};\n\n open = ${JSON.stringify(openCard)} ${remaining.length}`
// );

// [
//   mkSequence(game, ["H9", "H8", "HT"].map(mkCard)),
//   mkSequence(game, ["CA", "CK", "CQ"].map(mkCard)),
//   mkSequence(game, ["J2", "CK", "CQ"].map(makeCard)),
//   makeSequence(game, ["J2", "J2", "CQ"].map(makeCard)),
//   makeSequence(game, ["J2", "J2", "J1"].map(makeCard)),
// ].forEach((s, i) => {
//   assert(!(s instanceof Error));
//   debug(` seq: ${JSON.stringify(s)}`);
// });

// [
//   // errors
//   makeSequence(game, ["HJ", "CQ", "HT"].map(makeCard)),
//   makeSequence(game, ["H2", "HQ", "HT"].map(makeCard)),
//   makeSequence(game, ["H9", "HQ", "HT"].map(makeCard)),
// ].forEach((s, i) => {
//   debug(`${JSON.stringify(s)}`);
//   assert(s instanceof Error);
// });
// [
//   makeLife(game, ["H9", "H8", "HT"].map(makeCard)),
//   makeLife(game, ["CA", "CK", "CQ"].map(makeCard)),
// ].forEach((s, i) => {
//   assert(!(s instanceof Error));
//   debug(` seq: ${JSON.stringify(s)}`);
// });

// [
//   // errors
//   makeLife(game, ["J2", "CK", "CQ"].map(makeCard)),
//   makeLife(game, ["J2", "J2", "CQ"].map(makeCard)),
//   makeLife(game, ["J2", "J2", "J1"].map(makeCard)),
// ].forEach((s, i) => {
//   assert(s instanceof Error);
// });

// [
//   makeTriplet(game, ["H9", "C9", "S9"].map(makeCard)),
//   makeTriplet(game, ["H9", "C9", "S9", "J1"].map(makeCard)),
// ].forEach((s, i) => {
//   assert(!(s instanceof Error));
//   debug(` triplet: ${JSON.stringify(s)}`);
// });

// [
//   // errors
//   makeTriplet(game, ["J2", "CK", "CQ"].map(makeCard)),
//   makeTriplet(game, ["H9", "C9", "S9", "D9", "J1"].map(makeCard)),
// ].forEach((s, i) => {
//   assert(s instanceof Error);
// });
