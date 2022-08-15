import * as RA from 'fp-ts/lib/ReadonlyArray'
import { pipe } from 'fp-ts/lib/function'
import { Hand, Rank, Suit } from '../src/types';
import { mkCard, strToCard } from '../src/card';
import { meldToJSON } from '../src/meld';
import Debug from 'debug';
import { solveHand } from '../src/solving';

const debug = Debug('app:solving');

// cards represeneted as two character strings
// joker are "J1"
// Ohter cards are represented as  "<suit><rank>"
// suit characters are: "S" for Spades, "H" for Hearts, "D" for Diamonds, "C" for Clubs
// rank characters are: "A" for Ace, "2" for 2, ...,
//    "T" for 10, "J" for Jack, "Q" for Queen, "K" for King
const poorHand = RA.map(strToCard)(
    [
        'CA', 'J1', 'C3',
        'C7', 'D7', 'H7', 'S7',
        'HT', 'DJ', 'HQ',
        'CA', 'H2', 'S3',
    ])
const winningHand = RA.map(strToCard)(
    [
        'CA', 'C7', 'D7', 'H7', 'S7', 'C3',
        'HT', 'J1', 'HQ',
        'J1', 'J1', 'J1', 'C2',
    ])
// Make a wildcard joker
const wcj = mkCard(Suit.Diamonds, Rank.Ace);

// eslint-disable-next-line functional/no-expression-statement
RA.map((hand: Hand) => {

    //const tmp = solveHand(wcj, hardHand);
    const melds = pipe(
        solveHand(wcj, hand),
        RA.map(meldToJSON)
    )

    // eslint-disable-next-line functional/no-expression-statement
    debug(`allMelds: ${JSON.stringify(melds.length)}`);
    // eslint-disable-next-line functional/no-expression-statement
    debug(`allMelds: ${JSON.stringify(melds[0], null, 4)}`);
    return undefined;
})([poorHand, winningHand]);