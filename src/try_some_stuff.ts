import {
  makeGame,
  makeMove,
  dealFromDeck,
  makeSequence,
  makeLife,
  makeTriplet,
} from "./game";
import { makeDeck, mergeDecks, makeCard } from "./card";
import { GameRestricted } from "./types";
import Dbg from "debug";
const debug = Dbg("app:test");

import assert from "assert";
const d1 = makeDeck();
const d2 = makeDeck();
const ds = mergeDecks([d1, d2]);
//debug(`${JSON.stringify(ds)}`);
assert(ds.length === 108);

const [remaining, hands, openCard, joker] = dealFromDeck(ds, 6, 13);
const nLeft = 108 - 13 * 6 - 2;
//debug(`Check ${remaining.length} === ${nLeft}`);
assert(
  remaining.length === nLeft,
  `Remaining cards ${remaining.length} !== ${nLeft}`
);

const game: GameRestricted = makeGame(
  ["Murali", "Arun", "Ramu", "Sri"],
  "Murali"
);

debug(
  `hands=${JSON.stringify(hands)};\n\n Remaining= ${JSON.stringify(
    remaining
  )};\n\n open = ${JSON.stringify(openCard)} ${remaining.length}`
);

[
  makeSequence(game, ["H9", "H8", "HT"].map(makeCard)),
  makeSequence(game, ["CA", "CK", "CQ"].map(makeCard)),
  makeSequence(game, ["J2", "CK", "CQ"].map(makeCard)),
  makeSequence(game, ["J2", "J2", "CQ"].map(makeCard)),
  makeSequence(game, ["J2", "J2", "J1"].map(makeCard)),
].forEach((s, i) => {
  assert(!(s instanceof Error));
  debug(` seq: ${JSON.stringify(s)}`);
});

[
  // errors
  makeSequence(game, ["HJ", "CQ", "HT"].map(makeCard)),
  makeSequence(game, ["H2", "HQ", "HT"].map(makeCard)),
  makeSequence(game, ["H9", "HQ", "HT"].map(makeCard)),
].forEach((s, i) => {
  debug(`${JSON.stringify(s)}`);
  assert(s instanceof Error);
});
[
  makeLife(game, ["H9", "H8", "HT"].map(makeCard)),
  makeLife(game, ["CA", "CK", "CQ"].map(makeCard)),
].forEach((s, i) => {
  assert(!(s instanceof Error));
  debug(` seq: ${JSON.stringify(s)}`);
});

[
  // errors
  makeLife(game, ["J2", "CK", "CQ"].map(makeCard)),
  makeLife(game, ["J2", "J2", "CQ"].map(makeCard)),
  makeLife(game, ["J2", "J2", "J1"].map(makeCard)),
].forEach((s, i) => {
  assert(s instanceof Error);
});

[
  makeTriplet(game, ["H9", "C9", "S9"].map(makeCard)),
  makeTriplet(game, ["H9", "C9", "S9", "J1"].map(makeCard)),
].forEach((s, i) => {
  assert(!(s instanceof Error));
  debug(` triplet: ${JSON.stringify(s)}`);
});

[
  // errors
  makeTriplet(game, ["J2", "CK", "CQ"].map(makeCard)),
  makeTriplet(game, ["H9", "C9", "S9", "D9", "J1"].map(makeCard)),
].forEach((s, i) => {
  assert(s instanceof Error);
});
