"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.MoveType = exports.PlayerStatus = exports.Rank = exports.Suit = void 0;
//import * as IOEither from "fp-ts/lib/IOEither";
// ♣♦♥♠  ♧♢♡♤
var Suit;
(function (Suit) {
    Suit["Clubs"] = "C";
    Suit["Diamonds"] = "D";
    Suit["Hearts"] = "H";
    Suit["Spades"] = "S";
    Suit["Joker"] = "J";
})(Suit = exports.Suit || (exports.Suit = {}));
var Rank;
(function (Rank) {
    Rank["Ace"] = "A";
    Rank["One"] = "1";
    Rank["Two"] = "2";
    Rank["Three"] = "3";
    Rank["Four"] = "4";
    Rank["Five"] = "5";
    Rank["Six"] = "6";
    Rank["Seven"] = "7";
    Rank["Eight"] = "8";
    Rank["Nine"] = "9";
    Rank["Ten"] = "T";
    Rank["Jack"] = "J";
    Rank["Queen"] = "Q";
    Rank["King"] = "K";
})(Rank = exports.Rank || (exports.Rank = {}));
var PlayerStatus;
(function (PlayerStatus) {
    PlayerStatus[PlayerStatus["Active"] = 0] = "Active";
    PlayerStatus[PlayerStatus["OwesCard"] = 1] = "OwesCard";
    PlayerStatus[PlayerStatus["Dropped"] = 2] = "Dropped";
    PlayerStatus[PlayerStatus["Won"] = 3] = "Won";
    PlayerStatus[PlayerStatus["Lost"] = 4] = "Lost";
})(PlayerStatus = exports.PlayerStatus || (exports.PlayerStatus = {}));
var MoveType;
(function (MoveType) {
    MoveType[MoveType["Drop"] = 0] = "Drop";
    MoveType[MoveType["TakeOpen"] = 1] = "TakeOpen";
    MoveType[MoveType["TakeFromDeck"] = 2] = "TakeFromDeck";
    MoveType[MoveType["ReturnExtraCard"] = 3] = "ReturnExtraCard";
    MoveType[MoveType["Meld"] = 4] = "Meld";
    MoveType[MoveType["Show"] = 5] = "Show";
    MoveType[MoveType["Finish"] = 6] = "Finish";
})(MoveType = exports.MoveType || (exports.MoveType = {}));
var GameState;
(function (GameState) {
    GameState[GameState["Active"] = 0] = "Active";
    GameState[GameState["Finished"] = 1] = "Finished";
})(GameState = exports.GameState || (exports.GameState = {}));
