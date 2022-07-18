// Persistence layer for Game

import { gamePlayersLens } from "./card";
import { CreateGameInput, IGame, IGameStore } from "./types";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/function";
import assert from "assert";
export function mkMemoryStore() {
  const GAMES: IGame[] = [];

  const memoryStore: IGameStore = {
    createGame: (game: CreateGameInput) =>
      pipe(
        TE.tryCatch(
          () => {
            const id = GAMES.length;
            GAMES[id] = { id, ...game };
            return Promise.resolve(GAMES[id]);
          },
          (err) => new Error(`begin txn failed: ${err}`)
        )
      ),
    saveGame: (game: IGame) =>
      pipe(
        TE.tryCatch(
          () => {
            const g = GAMES[game.id];
            assert(g);
            GAMES[g.id] = game;
            return Promise.resolve(GAMES[g.id]);
          },
          (err) => new Error(`begin txn failed: ${err}`)
        )
      ),
    loadGame: (gameId: number) =>
      pipe(
        TE.tryCatch(
          () => {
            const g = GAMES[gameId];
            assert(g);
            return Promise.resolve(g);
          },
          (err) => new Error(`begin txn failed: ${err}`)
        )
      ),
  };
  return memoryStore;
}

export function ensureStore(store?: IGameStore): IGameStore {
  return store || mkMemoryStore();
}
