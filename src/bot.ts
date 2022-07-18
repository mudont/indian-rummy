/**
 * TODO: Implement a bot who can play the game.
 *
 * Bots will help test the core library, as we can simulate
 * games among bots.
 * We might be able to use Reinforcement learning to train bots.
 *
 * @param {GameRestricted} game - The game object.
 * Link below contains an algortihm for Gin Rummy:
 * https://www.cs.uic.edu/~troy/fall01/cs340/mp2.html
 * That should work as an intermediate level bot
 * 1. There could be a "Monkey" level bot that just randomly picks up and throws card
 * without even SHOWing
 * 2. Novice algorithm
 * 3. intermediate algo from above Gin Rummy link.
 * 3. probability based algo that knows which player tossed what cards and tries to deprioritize partial melds which need cards that are in discard pile. It could try to feed useless cards to the next player
 */
import { GameRestricted, IGame } from "./types";
