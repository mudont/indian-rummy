// Persistence layer for Game
// This is a simple in-memory implementation.
// It is not intended to be used in production.
// Since this involves persistent storage, it is purely functional. Well we could pass around
// a GAMES array, but we are trying to implement the interface for persistent storage.
// It would have to be non funcitonal when using a real database.

import { gamePlayersLens } from "./card";
import { CreateGameInput, IGame, IGameStore } from "./types";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/function";
import assert from "assert";
export function mkMemoryStore(): TE.TaskEither<Error, IGameStore> {
  // eslint-disable-next-line prefer-const, functional/no-let, functional/prefer-readonly-type
  let GAMES: IGame[] = [];
  const memoryStore: IGameStore = {
    createGame: (game: CreateGameInput) =>
      pipe(
        TE.tryCatch(
          () => {
            const id = GAMES.length;
            // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
            GAMES[id] = { id, ...game };
            return Promise.resolve(GAMES[id]);
          },
          (err) => new Error(`begin txn failed: ${String(err)}`)
        )
      ),
    saveGame: (game: IGame) =>
      pipe(
        TE.tryCatch(
          () => {
            const g = GAMES[game.id];
            // eslint-disable-next-line functional/no-expression-statement
            assert(g);
            // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
            GAMES[g.id] = game;
            return Promise.resolve(GAMES[g.id]);
          },
          (err) => new Error(`begin txn failed: ${String(err)}`)
        )
      ),
    loadGame: (gameId: number) =>
      pipe(
        TE.tryCatch(
          () => {
            const g = GAMES[gameId];
            // eslint-disable-next-line functional/no-expression-statement
            assert(g);
            return Promise.resolve(g);
          },
          (err) => new Error(`begin txn failed: ${String(err)}`)
        )
      ),
  };

  return TE.tryCatch(
    // eslint-disable-next-line functional/no-return-void
    () => new Promise((resolve, reject) => resolve(memoryStore)),
    (reason: unknown) => Error(String(reason))
  );
}
