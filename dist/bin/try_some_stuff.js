"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable functional/no-expression-statement */
const game_1 = require("../src/game");
const card_1 = require("../src/card");
const types_1 = require("../src/types");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)("app:test");
const function_1 = require("fp-ts/lib/function");
const IOE = __importStar(require("fp-ts/lib/IOEither"));
const E = __importStar(require("fp-ts/lib/Either"));
const A = __importStar(require("fp-ts/lib/ReadonlyArray"));
const R = __importStar(require("ramda"));
const store_1 = __importDefault(require("../src/store"));
const assert_1 = __importDefault(require("assert"));
const ordCard = {
    equals: (a, b) => a.rank === b.rank && a.suit === b.suit,
    compare: (a, b) => (a.suit === b.suit) ?
        (a.rank === b.rank ? 0 : a.rank < b.rank ? -1 : 1) :
        a.suit < b.suit ? -1 : 1
};
const d1 = (0, card_1.mkDeck)(1);
const d2 = (0, card_1.mkDeck)(1);
const ds = A.sort(ordCard)((0, card_1.mergeDecks)([d1, d2]));
//debug(`${JSON.stringify(ds)}`);
(0, assert_1.default)(ds.length === 108);
//const [remaining, hands, openCard, joker] = dealFromDeck(ds, 6, 13);
const dealRes = (0, game_1.dealFromDeck)(ds, 6, 13);
const sa = (0, card_1.mkCard)(types_1.Suit.Clubs, types_1.Rank.Ace);
const dflt = [(0, card_1.mkDeck)(1), [[]], sa, sa];
const deal = E.getOrElse(() => dflt)(dealRes());
// debug(`Result: ${JSON.stringify(deal)}`);
const [remaining, hands, openCard, joker] = deal;
// debug(`Result: ${remaining.length} ${hands.length} ${hands[5].length} ${openCard.rank} ${openCard.suit} ${joker.rank} ${joker.suit}`);
const reassembled = A.sort(ordCard)(A.concat(remaining)(A.concat(A.flatten(hands))([joker, openCard])));
// debug(`Reassembled: ${reassembled.length}`);
// debug(`Reassembled: ${JSON.stringify(reassembled)}`);
// debug(`ds: ${JSON.stringify(ds)}`);
// debug(`A.zip(reassembled, ds): ${A.zip(reassembled, ds).length}`);
(0, assert_1.default)(JSON.stringify(reassembled) === JSON.stringify(ds), "reassembled deck is equal to original deck");
(0, assert_1.default)(remaining.length === 108 - 6 * 13 - 1 - 1, "remaining deck is of correct size");
(0, assert_1.default)(hands.length === 6, "hands is of correct size");
(0, assert_1.default)(hands[0].length === 13, "hands[0] is of correct size");
const myHand = (game, user) => E.map(g => g.myHand)((0, game_1.getRestrictedView)(game, R.findIndex(R.propEq("user", "Murali"), game.players)));
const session = (0, function_1.pipe)(IOE.Do, IOE.bind('store', () => store_1.default), IOE.bind('game_', () => (0, game_1.mkGame)(["Murali", "Arun", "Ramu", "Sri"])), IOE.bind('game', (sc => sc.store.createGame(sc.game_))), IOE.bind('g2', (sc) => (0, game_1.mkMove)(sc.game, { moveType: types_1.MoveType.TakeFromDeck, player: "Murali", })), IOE.bind('hand', (sc) => IOE.fromEither(myHand(sc.g2, "Murali"))), IOE.bind('g3', (sc) => (0, game_1.mkMove)(sc.g2, { moveType: types_1.MoveType.ReturnExtraCard, cardDiscarded: sc.hand[0], player: "Murali", })), IOE.bind('g4', (sc) => (0, game_1.mkMove)(sc.g3, { moveType: types_1.MoveType.TakeOpen, player: "Arun", })), IOE.bind('hand2', (sc) => IOE.fromEither(myHand(sc.g4, "Arun"))), IOE.bind('g5', (sc) => (0, game_1.mkMove)(sc.g4, { moveType: types_1.MoveType.ReturnExtraCard, cardDiscarded: sc.hand2[0], player: "Arun", })), 
// IOE.bind('gdiff', (sc) => IOE.right(diff(sc.game, sc.g3))),
IOE.orElse((e) => {
    debug(`Error onLeft: ${e.message}`);
    return IOE.left(e);
}), IOE.chain(sc => {
    //debug(`Should n't get here if error sc: ${Object.keys(sc)}`);
    return IOE.right(sc);
}), IOE.bind('g6', (sc) => sc.store.saveGame(sc.g5)))();
// debug(`session: ${JSON.stringify(session())}`);
// const dfltGame = {id:-1, ... mkGame(["Murali", "Arun", "Ramu", "Sri"])
const ioeGfromStore = E.fold((e) => ({ err: e.message }), function_1.identity)((0, store_1.default)()).loadGame(0);
// debug(`game: ${JSON.stringify(ioeG())}`);
const gameFromStore = E.fold((e) => ({ id: -1 }), function_1.identity)(ioeGfromStore());
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
