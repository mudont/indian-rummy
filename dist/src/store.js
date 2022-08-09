"use strict";
// Persistence layer for Game
// This is a simple in-memory implementation.
// It is not intended to be used in production.
// Since this involves persistent storage, it is purely functional. Well we could pass around
// a GAMES array, but we are trying to implement the interface for persistent storage.
// It would have to be non funcitonal when using a real database.
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
const IOE = __importStar(require("fp-ts/lib/IOEither"));
const function_1 = require("fp-ts/function");
const assert_1 = __importDefault(require("assert"));
function mkMemoryStore() {
    // eslint-disable-next-line prefer-const, functional/no-let, functional/prefer-readonly-type
    let GAMES = [];
    const memoryStore = {
        createGame: (game) => {
            const id = GAMES.length;
            // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
            GAMES[id] = Object.assign({ id }, game);
            return IOE.right(GAMES[id]);
        },
        saveGame: (game) => (0, function_1.pipe)(IOE.tryCatch(() => {
            const g = GAMES[game.id];
            // eslint-disable-next-line functional/no-expression-statement
            (0, assert_1.default)(g);
            // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
            GAMES[g.id] = game;
            return GAMES[g.id];
        }, (err) => new Error(`begin txn failed: ${String(err)}`))),
        loadGame: (gameId) => (0, function_1.pipe)(IOE.tryCatch(() => {
            const g = GAMES[gameId];
            // eslint-disable-next-line functional/no-expression-statement
            (0, assert_1.default)(g);
            return g;
        }, (err) => new Error(`begin txn failed: ${String(err)}`))),
    };
    return IOE.tryCatch(
    // eslint-disable-next-line functional/no-return-void
    () => memoryStore, (reason) => Error(String(reason)));
}
exports.default = mkMemoryStore();
