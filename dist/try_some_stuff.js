"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
const card_1 = require("./card");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)("app:test");
const assert_1 = __importDefault(require("assert"));
const d1 = (0, card_1.makeDeck)();
const d2 = (0, card_1.makeDeck)();
const ds = (0, card_1.mergeDecks)([d1, d2]);
//debug(`${JSON.stringify(ds)}`);
(0, assert_1.default)(ds.length === 108);
const [remaining, hands, openCard, joker] = (0, game_1.dealFromDeck)(ds, 6, 13);
const nLeft = 108 - 13 * 6 - 2;
//debug(`Check ${remaining.length} === ${nLeft}`);
(0, assert_1.default)(remaining.length === nLeft, `Remaining cards ${remaining.length} !== ${nLeft}`);
const game = (0, game_1.makeGame)(["Murali", "Arun", "Ramu", "Sri"], "Murali");
debug(`hands=${JSON.stringify(hands)};\n\n Remaining= ${JSON.stringify(remaining)};\n\n open = ${JSON.stringify(openCard)} ${remaining.length}`);
[
    (0, game_1.makeSequence)(game, ["H9", "H8", "HT"].map(card_1.makeCard)),
    (0, game_1.makeSequence)(game, ["CA", "CK", "CQ"].map(card_1.makeCard)),
    (0, game_1.makeSequence)(game, ["J2", "CK", "CQ"].map(card_1.makeCard)),
    (0, game_1.makeSequence)(game, ["J2", "J2", "CQ"].map(card_1.makeCard)),
    (0, game_1.makeSequence)(game, ["J2", "J2", "J1"].map(card_1.makeCard)),
].forEach((s, i) => {
    (0, assert_1.default)(!(s instanceof Error));
    debug(` seq: ${JSON.stringify(s)}`);
});
[
    // errors
    (0, game_1.makeSequence)(game, ["HJ", "CQ", "HT"].map(card_1.makeCard)),
    (0, game_1.makeSequence)(game, ["H2", "HQ", "HT"].map(card_1.makeCard)),
    (0, game_1.makeSequence)(game, ["H9", "HQ", "HT"].map(card_1.makeCard)),
].forEach((s, i) => {
    debug(`${JSON.stringify(s)}`);
    (0, assert_1.default)(s instanceof Error);
});
[
    (0, game_1.makeLife)(game, ["H9", "H8", "HT"].map(card_1.makeCard)),
    (0, game_1.makeLife)(game, ["CA", "CK", "CQ"].map(card_1.makeCard)),
].forEach((s, i) => {
    (0, assert_1.default)(!(s instanceof Error));
    debug(` seq: ${JSON.stringify(s)}`);
});
[
    // errors
    (0, game_1.makeLife)(game, ["J2", "CK", "CQ"].map(card_1.makeCard)),
    (0, game_1.makeLife)(game, ["J2", "J2", "CQ"].map(card_1.makeCard)),
    (0, game_1.makeLife)(game, ["J2", "J2", "J1"].map(card_1.makeCard)),
].forEach((s, i) => {
    (0, assert_1.default)(s instanceof Error);
});
[
    (0, game_1.makeTriplet)(game, ["H9", "C9", "S9"].map(card_1.makeCard)),
    (0, game_1.makeTriplet)(game, ["H9", "C9", "S9", "J1"].map(card_1.makeCard)),
].forEach((s, i) => {
    (0, assert_1.default)(!(s instanceof Error));
    debug(` triplet: ${JSON.stringify(s)}`);
});
[
    // errors
    (0, game_1.makeTriplet)(game, ["J2", "CK", "CQ"].map(card_1.makeCard)),
    (0, game_1.makeTriplet)(game, ["H9", "C9", "S9", "D9", "J1"].map(card_1.makeCard)),
].forEach((s, i) => {
    (0, assert_1.default)(s instanceof Error);
});
