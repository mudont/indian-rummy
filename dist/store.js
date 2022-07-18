"use strict";
// Persistence layer for Game
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
exports.ensureStore = exports.mkMemoryStore = void 0;
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const function_1 = require("fp-ts/function");
const assert_1 = __importDefault(require("assert"));
function mkMemoryStore() {
    const GAMES = [];
    const memoryStore = {
        createGame: (game) => (0, function_1.pipe)(TE.tryCatch(() => {
            const id = GAMES.length;
            GAMES[id] = Object.assign({ id }, game);
            return Promise.resolve(GAMES[id]);
        }, (err) => new Error(`begin txn failed: ${err}`))),
        saveGame: (game) => (0, function_1.pipe)(TE.tryCatch(() => {
            const g = GAMES[game.id];
            (0, assert_1.default)(g);
            GAMES[g.id] = game;
            return Promise.resolve(GAMES[g.id]);
        }, (err) => new Error(`begin txn failed: ${err}`))),
        loadGame: (gameId) => (0, function_1.pipe)(TE.tryCatch(() => {
            const g = GAMES[gameId];
            (0, assert_1.default)(g);
            return Promise.resolve(g);
        }, (err) => new Error(`begin txn failed: ${err}`))),
    };
    return memoryStore;
}
exports.mkMemoryStore = mkMemoryStore;
function ensureStore(store) {
    return store || mkMemoryStore();
}
exports.ensureStore = ensureStore;
