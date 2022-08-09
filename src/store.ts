// Persistence layer for Game
// This is a simple in-memory implementation.
// It is not intended to be used in production.
// Since this involves persistent storage, it is purely functional. Well we could pass around
// a GAMES array, but we are trying to implement the interface for persistent storage.
// It would have to be non funcitonal when using a real database.

import { CreateGameInput, IGame, IGameStore } from "./types";
import * as IOE from "fp-ts/lib/IOEither";
import { pipe } from "fp-ts/function";
import assert from "assert";
function mkMemoryStore(): IOE.IOEither<Error, IGameStore> {
    // eslint-disable-next-line prefer-const, functional/no-let, functional/prefer-readonly-type
    let GAMES: IGame[] = [];
    const memoryStore: IGameStore = {
        createGame: (game: CreateGameInput) => {
            const id = GAMES.length;
            // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
            GAMES[id] = { id, ...game };
            return IOE.right(GAMES[id]);
        },
        saveGame: (game: IGame) =>
            pipe(
                IOE.tryCatch(
                    () => {
                        const g = GAMES[game.id];
                        // eslint-disable-next-line functional/no-expression-statement
                        assert(g);
                        // eslint-disable-next-line functional/no-expression-statement, functional/immutable-data
                        GAMES[g.id] = game;
                        return GAMES[g.id];
                    },
                    (err) => new Error(`begin txn failed: ${String(err)}`)
                )
            ),
        loadGame: (gameId: number) =>
            pipe(
                IOE.tryCatch(
                    () => {
                        const g = GAMES[gameId];
                        // eslint-disable-next-line functional/no-expression-statement
                        assert(g);
                        return g;
                    },
                    (err) => new Error(`begin txn failed: ${String(err)}`)
                )
            ),
    };

    return IOE.tryCatch(
        // eslint-disable-next-line functional/no-return-void
        () => memoryStore,
        (reason: unknown) => Error(String(reason))
    );
}
export default mkMemoryStore()