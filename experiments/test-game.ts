import * as G from '../src/game';
import { traceWithValue } from 'fp-ts-std/Debug'
import Debug from 'debug'
import { flow, pipe } from 'fp-ts/lib/function';
//import { pipe } from 'ramda';
const debug = Debug('app:test-game');

// [ 0, 0, 0, 1, 3 ]
const diffs = flow(G.sequenceGaps, traceWithValue('tr lagDiff:'))([1, 2, 3, 5, 9]);

// eslint-disable-next-line functional/no-expression-statement
//debug(`lagDiff: ${JSON.stringify(diffs)}`);