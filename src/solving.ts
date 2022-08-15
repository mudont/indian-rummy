/**
 * https://stackoverflow.com/questions/51225335/determine-if-an-indian-rummy-hand-is-a-winning-hand-java
 * SOlution is partly inspired by
 * http://pds2.egloos.com/pds/200611/17/89/solving%20rummikub%20problems%20by%20integer%20linear%20programming.pdf
 * We use their idea of enumerating all possible sets, but  we don't use an MILP solver.
 * That would likely be slower our more direct approach.
 * Typescript and fp-ts may not be the best choice for high performance though.
 */
import * as NEA from 'fp-ts/lib/ReadonlyNonEmptyArray'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import { flow, pipe } from 'fp-ts/lib/function'
import { cardFromStr, cardsEqual, cardToJSON, getAllCards, getNonJokerRanks, getNonJokerSuits, mkCard, strToCard } from './card';
import { Card, Hand, IMeldedHand, Rank, Suit } from './types';
import * as E from "fp-ts/lib/Either"
import * as C from "./combinatorics"
import * as R from "ramda";
import Debug from 'debug';
import { meldToJSON, mkMeldFromSetVecs } from './meld';

const debug = Debug('app:solving');
type Seq = readonly Card[];
type SetVec = readonly number[];

const allRanks = getNonJokerRanks();
const wrappedRanks = RA.append(allRanks[0])(allRanks);
/**
 * Make all possible pure sequences of given length for given suit
 */
export const mkSeqs = (suit: Suit, nCards: number, seqLen: number, firstCanBeLast: boolean)
    : readonly Seq[] => {
    const nSeqs = nCards - seqLen + (firstCanBeLast ? 2 : 1)
    return pipe(
        NEA.range(0, nSeqs - 1),
        RA.map(i =>
            pipe(
                NEA.range(i, i + seqLen - 1),
                RA.map((j: number): Rank => wrappedRanks[j]),
                RA.map(l => mkCard(suit, l))
            )
        )
    )
}

/**
 * Leave this suit out from all suits.
 * @param suit
 * @returns
 */
export const getAllButThisSuit = (suit: Suit): readonly Suit[] => {
    const allSuits = getNonJokerSuits();
    return RA.filter((s: Suit) => s !== suit && s !== Suit.Joker)(allSuits)
}

/**
 * Make all possible triplets for given rank
 * @param rank
 * @returns
 */
export const mkTriplets = (rank: Rank): readonly (readonly Card[])[] =>
    pipe(
        getNonJokerSuits(),
        RA.map(getAllButThisSuit),
        flow(
            RA.map(
                RA.map(suit => mkCard(suit, rank))
            )
        )
    )
/**
 * Make all possible quadruplets (just one actually) for given rank
 * @param rank
 * @returns
 */
export const mkQuadruplets = (rank: Rank): readonly (readonly Card[])[] =>
    pipe(
        [getNonJokerSuits()],
        flow(
            RA.map(
                RA.map(suit => mkCard(suit, rank))
            )
        )
    )

type RummySet = readonly Card[];
type RummySets = readonly RummySet[];
type RummySetss = readonly RummySets[];

export const allPureSeqs3 = RA.chain((s: Suit) => mkSeqs(s, 13, 3, true))(getNonJokerSuits());
export const allPureSeqs4 = RA.chain((s: Suit) => mkSeqs(s, 13, 4, true))(getNonJokerSuits());
export const allPureSeqs5 = RA.chain((s: Suit) => mkSeqs(s, 13, 5, true))(getNonJokerSuits());
export const allPureSeqs = RA.flatten([
    allPureSeqs3, allPureSeqs4, allPureSeqs5
]);

export const getNumCardsInVec = (vec: SetVec): number =>
    RA.reduce<number, number>(0, (acc, i) => acc + i)(vec)

export const allPureTriplets = RA.flatten(RA.map(mkTriplets)(getNonJokerRanks()));

const allPureGroups = RA.flatten([
    RA.chain(mkQuadruplets)(getNonJokerRanks()),
    allPureTriplets,
])

const allSeqsWithJokers = pipe(
    allPureSeqs,
    // RA.takeRight(2),
    RA.chain((pureSet: Seq) =>
        RA.chain((nJokers: number) =>
            pipe(
                C.combinations(pureSet, pureSet.length - nJokers),
                Array.from,
                RA.map(combination => combination as readonly Card[]),
                RA.map((shortSeq: Seq) =>
                    RA.concat(RA.replicate(nJokers, mkCard(Suit.Joker, Rank.Joker)))(shortSeq)
                )
            )
        )(NEA.range(1, pureSet.length - 1))
    ),
)

const allGroupsWithJokers = pipe(
    allPureGroups,
    // RA.takeRight(2),
    RA.chain((pureSet: Seq) =>
        RA.chain((nJokers: number) =>
            pipe(
                C.combinations(pureSet, pureSet.length - nJokers),
                Array.from,
                RA.map(combination => combination as readonly Card[]),
                RA.map((shortSeq: Seq) =>
                    RA.concat(RA.replicate(nJokers, mkCard(Suit.Joker, Rank.Joker)))(shortSeq)
                )
            )
        )(NEA.range(1, pureSet.length - 1))
    ),
)

export const getCardCounts = (cardList: readonly Card[]) =>
    R.countBy(cardToJSON)(cardList)


const allCards = getAllCards();
/**
 * Convert a list of cards to a vector of 53 counts.
 * numInstances if the card is in the list, 0 otherwise.
 * @param cardList
 * @returns
 */
export const cardListToCountsVector = (cardList: readonly Card[]) => {
    const counts = getCardCounts(cardList)
    const cardsArr = Object.keys(counts)
    const countsArr = Object.values(counts);
    return RA.map<Card, number>(c => {
        const ix = cardsArr.findIndex(card => cardsEqual(cardFromStr(card), c))
        const val = ix < 0 ? 0 : countsArr[ix]
        return val
    })(allCards)
}

const allSequences = RA.flatten([allPureSeqs, allSeqsWithJokers]);
const allSets = RA.flatten([allPureSeqs, allPureGroups, allSeqsWithJokers, allGroupsWithJokers]);
const allPureSeqsVec = pipe(
    allPureSeqs,
    RA.map(cardListToCountsVector),
)
const allSequencesVec = pipe(
    allSequences,
    RA.map(cardListToCountsVector),
)
const allSetsVec = pipe(
    allSets,
    RA.map(cardListToCountsVector),
)


/**
 * XXX: Possibly not needed.
 * Convert a list of cards to a vector of 53 indicators.
 * 1 if the card is in the list, 0 otherwise.
 * @param cardList
 * @returns
 */
// export const cardListToVector = (cardList: readonly Card[]) =>
//     RA.map((c: Card) => cardList.findIndex(card => cardsEqual(card, c)) < 0 ? 0 : 1)(allCards)

/** Get card list from counts vector
 *
 */
export const countsVectorToCardList = (counts: readonly number[]): readonly Card[] =>
    pipe(
        counts,
        RA.chainWithIndex(
            (i, cnt) => {
                const cards = cnt === 0 ? [] : RA.replicate(cnt, allCards[i])
                return cards
            }
        )
    )
export const setsArrData = RA.map(cardListToCountsVector)(allSets)

/**
 *
 * @param handVec
 * @param setVec
 * @returns given hand with given set removed
 */
export const handMinusSet = (handVec: SetVec) => (setVec: SetVec) =>
    RA.mapWithIndex<number, number>((ix, val) => handVec[ix] - val)(setVec)

/**
 * @param handVector
 * @param allSetsVector
 * @returns subset of given "all" sets that could be made from the given hand.
 */
const getFeasibleSets = (handVec: SetVec) =>
    RA.filter((setVec: SetVec) => {
        const hms = handMinusSet(handVec)(setVec)
        return R.all<number>(i => i >= 0)(hms)
    })
//export const getFeasibleSets = memoize()<ReturnType<typeof getFeasibleSets_>>(getFeasibleSets_);

type LifeAndRest = readonly [SetVec, SetVec];
type SeqAndRest = readonly [SetVec, SetVec];
type SetAndRest = readonly [SetVec, SetVec];
type LifeSeqAndRest = readonly [SetVec, SetVec, SetVec];
type LifeSeqSetAndRest = readonly [SetVec, SetVec, SetVec, SetVec]; type FinalMeldVec = readonly [SetVec, SetVec, SetVec, SetVec, SetVec];
export interface SolverCtx {
    readonly feasiblePureSeqs: readonly (SetVec)[]
    readonly feasibleSeqs: readonly (SetVec)[]
    readonly feasibleSets: readonly (SetVec)[]
    readonly handVec: SetVec
    readonly wcj: Card
}

const getLifeAndRemainingCards = (ctx: SolverCtx) => (
    handVec: SetVec
): readonly LifeAndRest[] =>
    pipe(
        ctx.feasiblePureSeqs,
        // getFeasibleSets(handVec),
        RA.map(life =>
            [life, handMinusSet(handVec)(life)]
        )
    )

const getSecondSeqAndRemainingCards = (ctx: SolverCtx) => (remainingHandVec: SetVec): readonly SeqAndRest[] => pipe(
    ctx.feasibleSeqs,
    getFeasibleSets(remainingHandVec),
    RA.map(seq =>
        [seq, handMinusSet(remainingHandVec)(seq)]
    ),
)

const getSetAndRemainingCards = (ctx: SolverCtx) => (remainingHandVec: SetVec): readonly SetAndRest[] => pipe(
    ctx.feasibleSets,
    getFeasibleSets(remainingHandVec),
    RA.map(set =>
        [set, handMinusSet(remainingHandVec)(set)]
    ),
)

//------------------------------------------------------------------------------
// 1.
export const getLife1Melds = (ctx: SolverCtx) => (handVec: SetVec): readonly LifeAndRest[] => {
    const tmp = getLifeAndRemainingCards(ctx);
    const lrc = getLifeAndRemainingCards(ctx)(handVec)
    return lrc.length === 0 ? [[[], handVec]] : lrc
}

// 2.
export const getSeq2MeldsOpt = (ctx: SolverCtx) => (
    life: SetVec, handVec: SetVec
): readonly LifeSeqAndRest[] =>
    life.length === 0 ? [[life, [], handVec]] : getSeq2Melds(ctx)(life, handVec)

export const getSeq2Melds = (ctx: SolverCtx) => (life: SetVec, handVec: SetVec): readonly LifeSeqAndRest[] => {
    const lrc = getSecondSeqAndRemainingCards(ctx)(handVec)
    return lrc.length === 0 ? [[life, [], handVec]] : RA.map<LifeAndRest, LifeSeqAndRest>(seq => [life, seq[0], seq[1]])(lrc)
}

// 3.
export const getSet3MeldsOpt = (ctx: SolverCtx) => (
    life: SetVec, seq1: SetVec, handVec: SetVec
): readonly LifeSeqSetAndRest[] =>
    seq1.length === 0 ? [[life, seq1, [], handVec]] : getSet3Melds(ctx)(life, seq1, handVec)

export const getSet3Melds = (ctx: SolverCtx) => (life: SetVec, seq1: SetVec, handVec: SetVec): readonly LifeSeqSetAndRest[] => {
    const lrc = getSetAndRemainingCards(ctx)(handVec)

    return lrc.length === 0 ? [[life, seq1, [], handVec]] : RA.map<SetAndRest, LifeSeqSetAndRest>(seq => [life, seq1, seq[0], seq[1]])(lrc)
}

// 4.
export const getFinalMeldsOpt = (ctx: SolverCtx) => (
    life: SetVec, seq1: SetVec, set3: SetVec, handVec: SetVec
): readonly FinalMeldVec[] => {
    return set3.length === 0 || getNumCardsInVec(handVec) < 3 ?
        [[life, seq1, set3, [], handVec]] :
        getFinalMelds(ctx)(life, seq1, set3, handVec)
}

export const getFinalMelds = (ctx: SolverCtx) => (life: SetVec, seq1: SetVec, set3: SetVec, handVec: SetVec): readonly FinalMeldVec[] => {
    const lrc = getSetAndRemainingCards(ctx)(handVec)

    return lrc.length === 0 ? [[life, seq1, set3, [], handVec]] : RA.map<SetAndRest, FinalMeldVec>(seq => [life, seq1, set3, seq[0], seq[1]])(lrc)
}
//------------------------------------------------------------------------------

//==========================================================================================

/**
  * Possible algorithm for checking potential winning hand:
  *
  * Look for possible pure sequences of cards in the hand. Sorting by suit and and rank should help
  *
  * For each Suit,
  *
  * The 12 possible pure 3-sequences are:
  * A23, 234, 345, 456, 567, 678, 789, 89J, 9TJ, TJQ, JQK, QKA
  *
  * The 11 pure 4-sequences are:
  * A234, 2345, 3456, 4567, 5678, 6789, 789T, 89TJ, 9TJQ, TJQK, JQKA
  *
  * The 10 pure 5-sequences are:
  * *Filled by Copilot. cool!*
  * A2345, 23456, 34567, 45678, 56789, 6789T, 789TJ, 89TJQ, 9TJQK, TJQKA
  *===============================================================================================
  * The 13 + 12 = 25 possible 3-sequences with 1 joker are:
  * 13 pairs
  * 12 pure 3-aeq with middle card missing
  *
  * The 13 possible 3-sequences with 2 jokers are:
  * 13 singles
  *--------------------------------------------------------------------------------------------
  * The (12 + 11*2)= 34 4-sequences with 1 joker are:
  * 12 pure 3-sequences
  * 11 pure 4-seq with any one of 2 middle cards missing
  *
  *
  * The (25+11)=36 4-sequences with 2 joker are:
  * 25 3-sequences with 1 joker
  * 11 pure 4-seq with two of 2 middle cards missing
  *
  * The 13 4-sequences with 3 joker are:
  * A,   2,   3,   4,   5,   6,   7,   8,   9,   T,   J,   Q,   K
  *--------------------------------------------------------------------------------------------
  * The (11+ 3*10)= 41 5-sequences with 1 joker are:
  * 11 pure 4-seq
  * 10 pure 5-seq with any one middle card out of 3 missing . 3 ways to do this
  *
  *
  * The (34 + 10*30)=64 5-sequences with 2 joker are:
  * 34 4-seq with 1 joker
  * 10 pure 5-seq with any 2 of 3 missing (3C2 = 3)
  *
  * The (13 + 12 + 36+ 10)=71 5-sequences with 3 joker are:
  * 36 4-seq with 2 joker
  * 10 pure 5-seq with any 3 of 3 missing (1 way)
  *
  * The 13 5-sequences with 4 joker are:
  * 13 singles
  *
  *--------------------------------------------------------------------------------------------
  * Above repeated for each suit
  * 1372 sequences total
  * =============================================================================================
  * 4 pure 3-triplets
  * 1 pure quadruplet
  * 4C2=6 triplets with 1 joker
  * 4C1=4 triplets with 2 joker
  * 4C3=4 quadruplets with 1 joker
  * 4C2=6 quadruplets with 2 joker
  * 4C1=4 quadruplets with 3 joker
  * 13 * (4 + 1 + 6 + 4 +4+6+4)= 377 triplets total
  * 1372 + 377 = 1749 sets total
  * =============================================================================================
  * NOTE: sequences of 6 or more cards can be ignored,
  * since the 3 extra cards can always be made into their own
  * sequence. THus there is no risk of orphaning cards that could have been
  * tacked on to the end ofanother sequence
  *
  * We can check for each of the above 33 x 4 (suits) = 132 sequences in the hand.
  * If none found, return with error "No pure sequence (life) found"
  * Else continue.
  *
  * For each pure 3/4/5-sequence found,
  * check  if at least one other sequence with or without joker
  * can be made from the remaining cards.
  * If not found, return with error "No second sequence found"
  * Else continue searching remaining cards
  * for each potential life and 2nd-sequence discovered
  *
  * Look for 3/4/5-sequences with or without joker or
  * triplets/quadruplets with or without joker
  *
  * High level algorithm:
  * For each posible pure 3/4/5-sequence,
  *   For each other 3/4/5-sequence with or without joker
  *      For each other 3/4/5-sequence or triplet/quadruplet with or without joker
  *         if less than 3 cards left, fail
  *        else if remaining cards make a valid sequence wowj, or triplet/quadruplet wowj
  *             return success
  *
  * Helper functions:
  * - Partition hand by suit (for sequence checking).  sort within suit by rank
  *   Jokers should a "suit" of their own.
  * - Partition hand by rank (for triplets)
  * - check for sequence
  *   diff
  *   if sum of diffs is <= numJokers, return true
  * - check for triplet within rank
  *   if numDistinctSuits + numJokers is >= 3, return true
  *
  * More detailed algorithm:
  * const lifePlusRests: [[life, rest]] = getLifes(hand);
  * error if no life found
  * const lifeSeq2Rests: [[left, seq2, rest]] = map(getSequences(rest), lifePlusRests)
  * error if no seq2 found
  * const lifeSeq2Set3Rests: [[left, seq2, set3, rest]] = \
  *       map(geSequences(rest), lifeSeq2Rests) +
  *       map(getTriplets(rest), lifeSeq2Rests)
  * error if no set3 found
  * If rest is empty, return success
  * if validSequence(rest), return success
  * If validTriplet(rest), return success
  * else return error
  *
  *
  * error if no set4 found
  * success!
  *
  * getLifes
  *   filter out jokerts and calle getSequences
  *
  * getSequences(hand, wantPure?)
  *   const [cRanks, dRanks, hRanks, sRanks, jokers] = partitionBySuit(hand);
  *   usableJokers = wantPure ? [] : jokers;
  *   allRankSeqs =
  *     getRankSequences(cRanks, usableJokers) +
  *     getRankSequences(dRanks, usableJokers) +
  *     getRankSequences(hRanks, usableJokers) +
  *     getRankSequences(sRanks, usableJokers)
  *   return map(toSequence, allRankSeqs)
  *
  * getTriplets(hand)
  *  const partition = partitionByRank(hand);
  *
  * getRankSequences(ranks, jokers)
  *   ordinals = map(rankToOrdinal, ranks)
  *
  */
/**
 * Check if this is a winning hand.
 *

 * Rules:
 * At least
 * @param wcJoker: Card
 * @param hand: Hand - The hand to check
 * @returns melded hand if it is a winning hand, error otherwise
 */

export function checkIfWinningHand(wcJoker: Card, hand: Hand): E.Either<Error, IMeldedHand> {
    const melds = solveHand(wcJoker, hand);
    return (melds && melds[0].points === 0) ? E.right(melds[0]) : E.left(new Error("Not a winning hand"));
}

/**
 * The key function of this module.
 * Try to find the best meld for the given hand.
 * @param wcj
 * @param hand
 * @returns
 */
export const solveHand = (wcj: Card, hand: Hand): readonly IMeldedHand[] => {
    // eslint-disable-next-line functional/no-expression-statement
    console.time("solveHand");
    const handVec = cardListToCountsVector(hand);
    const feasiblePureSeqs = getFeasibleSets(handVec)(allPureSeqsVec);
    const feasibleSeqs = getFeasibleSets(handVec)(allSequencesVec);
    const feasibleSets = getFeasibleSets(handVec)(allSetsVec);
    const ctx: SolverCtx = {
        handVec,
        feasiblePureSeqs,
        feasibleSeqs,
        feasibleSets,
        wcj
    }

    const melds = pipe(
        handVec,
        getLife1Melds(ctx),
        RA.chain((lr: LifeAndRest) => getSeq2MeldsOpt(ctx)(...lr)),
        RA.chain((lsr: LifeSeqAndRest) => getSet3MeldsOpt(ctx)(...lsr)),
        RA.chain((lssr: LifeSeqSetAndRest) => getFinalMeldsOpt(ctx)(...lssr)),
        RA.map(setsVec => mkMeldFromSetVecs(wcj, ...setsVec)),
        R.sort((meld: IMeldedHand) => meld.points),
    )
    // eslint-disable-next-line functional/no-expression-statement
    console.timeEnd("solveHand");
    return melds
}
