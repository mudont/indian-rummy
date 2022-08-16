import * as R from "ramda";
import {
    Card,
    Hand,
    IGame,
    ILife,
    IMeldedHand,
    ISequence,
    ITriplet,
    Joker,
    NonJokerRank,
    NonJokerSuit,
    PlayerStatus,
    Rank,
    Suit,
} from "./types";
import Dbg from "debug";
import {
    pointsOfCard,
    mkCard,
    cardToJSON,
    cardsEqual,
} from "./card";
import { sum, setDiff } from "./util";
import * as E from "fp-ts/lib/Either";
import * as S from "fp-ts/lib/string";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { reduce, map } from "fp-ts/lib/ReadonlyArray";
import { Refinement } from "fp-ts/lib/Refinement";
import { countsVectorToCardList } from "./solving";
import { FULL_COUNT_POINTS } from "./const";

const debug = Dbg("app:meld");

/**
 * Get list of cards in a sequence
 * @param {ISequence} seq
 * @returns Card[]
 */
export function cardsInSequence(seq: ISequence | ILife): readonly Card[] {
    return R.map((r: NonJokerRank) => mkCard(seq.suit as Suit, r as Rank))(
        seq.ranks
    );
}

/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
export function cardsInTriplet(trip: ITriplet): readonly Card[] {
    return R.map((s: NonJokerSuit) => mkCard(s as Suit, trip.rank))(trip.suits);
}
const isJoker: (wcj: Card) => Refinement<Card, Joker> = (wcj) => (card): card is Joker =>
    (card.suit === Suit.Joker && card.rank === Rank.Joker) || card === wcj;

/** Make ISequence out of given cards.
 * Caller needs to specify the suit of the sequence (in case they are all jokers)
 *
 */
export function mkLife(cards: readonly Card[]): ILife {
    return { suit: cards[0].suit, ranks: cards.map(c => c.rank) };
}
/** Make ISequence out of given cards.
 * Caller needs to specify the suit of the sequence (in case they are all jokers)
 *
 */
export function mkSequence(suit: Suit, cards: readonly Card[], wcj: Card): ISequence {
    const separated = RA.partition<Card, Card>(isJoker(wcj))(cards);
    const [nonJokers, jokers] = [separated.left, separated.right];
    const numJokers = jokers.length;
    return { suit, ranks: nonJokers.map(c => c.rank), numJokers };
}

/** Make ITriplet out of given cards.
 * Caller needs to specify the Rank of the triplet (in case they are all jokers)
 *
 */
export function mkTriplet(rank: Rank, cards: readonly Card[], wcj: Card): ITriplet {
    const separated = RA.partition<Card, Card>(isJoker(wcj))(cards);
    const [nonJokers, jokers] = [separated.left, separated.right];
    const numJokers = jokers.length;
    return { rank, suits: nonJokers.map(c => c.suit), numJokers };
}

export const isTriplet = (cs: readonly Card[]) => pipe(
    cs,
    RA.map(c => c.rank),
    RA.filter(r => r !== Rank.Joker),
    (ranks) => new Set(ranks).size,
) === 1;

export function mkMeldFromSetVecs(
    wcj: Card,
    lifeVec: readonly number[],
    seq1Vec: readonly number[],
    set3Vec: readonly number[],
    set4Vec: readonly number[],
    looseCardsVec: readonly number[],
): IMeldedHand {
    const set3 = countsVectorToCardList(set3Vec);
    const set4 = countsVectorToCardList(set4Vec);
    const tripletLists = RA.filter(isTriplet)([set3, set4]);
    const sequenceLists = RA.append(
        countsVectorToCardList(seq1Vec)
    )(
        RA.filter<readonly Card[]>(cs => !isTriplet(cs))([set3, set4])
    );
    const lifeCards = countsVectorToCardList(lifeVec);
    const life = lifeCards.length == 0 ? undefined : mkLife(lifeCards);
    const sequences = pipe(
        sequenceLists,
        RA.filter(cs => cs.length > 0),
        RA.map(
            (cs: readonly Card[]) => mkSequence(cs[0].suit, cs, wcj)
        )
    );
    const triplets = pipe(
        tripletLists,
        RA.filter(cs => cs.length > 0),
        RA.map(
            (cs: readonly Card[]) => mkTriplet(cs[0].rank, cs, wcj)
        )
    );
    const looseCards = countsVectorToCardList(looseCardsVec);
    const preMelded = { life, sequences, triplets, looseCards, wcj };
    const points = computePoints(wcj)(preMelded);
    return { ...preMelded, points };
}
export const mkNominalMeldedHand = (wcj: Card, hand: readonly Card[]): IMeldedHand => {
    const preMelded = ({ life: undefined, sequences: [], triplets: [], looseCards: hand, wcj })
    const points = computePoints(wcj)(preMelded);
    return { ...preMelded, points };
}
/**
 * turn ILife to a readable string
 * @param seq
 * @returns
 */
export const ilifeToJSON = (seq: ILife) => {
    const rs = RA.foldMap(S.Monoid)(r => r as string)(seq.ranks);
    return `<Life: ${seq.suit as string}->${rs}>`;
}

/**
 * turn ISequence to a readable string
 * @param seq
 * @returns
 */
export const iseqToJSON = (seq: ISequence) => {
    const rs = RA.foldMap(S.Monoid)(r => r as string)(seq.ranks);
    const wcs = RA.replicate(seq.numJokers, "*").join("");
    return `<Seq: ${seq.suit as string}->${rs}${wcs}>`;
}

/**
 * turn ISequence to a readable string
 * @param seq
 * @returns
 */
export const itripletToJSON = (seq: ITriplet) => {
    const ss = RA.foldMap(S.Monoid)(s => s as string)(seq.suits);
    const wcs = RA.replicate(seq.numJokers, "*").join("");
    return `[Triplet: ${ss}${wcs}-:${seq.rank as string}]`;
}

export const meldToJSON = (meld: IMeldedHand): string => {
    const life = meld.life ? ilifeToJSON(meld.life) : "";
    const sequences = RA.foldMap(S.Monoid)(iseqToJSON)(meld.sequences);
    const triplets = RA.foldMap(S.Monoid)(itripletToJSON)(meld.triplets);
    const looseCards = pipe(
        meld.looseCards,
        RA.map(cardToJSON)
    ).join(", ");
    // RA.foldMap(S.Monoid)(cardToJSON)(meld.looseCards);
    return `${life} / ${sequences} / ${triplets} / (loose: ${looseCards}) ==> ${meld.points} points`;
}
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export function mkWinningHand(
    wcj: Card,
    sequences: readonly ISequence[],
    triplets: readonly ITriplet[]
): E.Either<Error, IMeldedHand> {
    const cardsInSeq = (set: ISequence): number => set.ranks.length + set.numJokers;
    const cardsInTrip = (set: ITriplet): number => set.suits.length + set.numJokers;

    const cardsInSet = (set: ISequence | ITriplet): number =>
        'ranks' in set ? cardsInSeq(set) : cardsInTrip(set);

    const nCards = pipe(
        sequences,
        map(cardsInSet),
        reduce(0, (b, a) => b + a)
    ) + pipe(
        triplets,
        map(cardsInSet),
        reduce(0, (b, a) => b + a)
    )

    return pipe(
        E.Do,
        E.chain(E.fromPredicate(() => nCards === 13, () => new Error("Must have 13 cards"))),
        E.chain(E.fromPredicate(() => sequences.length >= 2, () => new Error("Must have at least 2 sequences"))),
        E.chain(E.fromPredicate(() => Boolean(R.find((s) => s.numJokers === 0, sequences)),
            () => new Error("Must have Life sequence"))),
        () => E.of(sequences.length + triplets.length),
        E.chain(() => E.of({
            life: R.find((s) => s.numJokers === 0, sequences),
            triplets,
            sequences: sequences.filter((s) => s.numJokers > 0),
            looseCards: [],
            points: FULL_COUNT_POINTS,
            wcj
        })),
    )
}

/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export function enumerateMeldedHand(meldedHand: IMeldedHand): readonly Card[] {
    const jokers = R.repeat(
        mkCard(Suit.Joker, Rank.Joker),
        sum(R.map(R.prop("numJokers"), meldedHand.triplets ?? [])) +
        sum(R.map(R.prop("numJokers"), meldedHand.sequences ?? []))
    );


    const lifeCards = meldedHand.life ? cardsInSequence(meldedHand.life) : [];
    const sequenceCards = R.flatten(
        R.map(cardsInSequence, meldedHand.sequences ?? [])
    );
    const tripleCards = R.flatten(
        R.map(cardsInTriplet, meldedHand.triplets ?? [])
    );
    return (
        meldedHand.life ?
            sequenceCards.length > 0 ?
                jokers.concat(lifeCards, sequenceCards, tripleCards)
                // If no second sequence after Life,
                // can't use triplets to save points
                : jokers.concat(lifeCards)
            // If no life only Jokers can be used to save points
            : jokers
    )
}

export const countPointsOfCards = (wcj: Card, cards: readonly Card[]): number =>
    Math.min(
        FULL_COUNT_POINTS,
        pipe(
            cards,
            RA.filter(c => !cardsEqual(c, wcj)),
            R.map(pointsOfCard),
            sum
        ))

export const computePoints = (wcj: Card) => (meld: Omit<IMeldedHand, 'points'>): number =>
    countPointsOfCards(wcj, meld.looseCards);

/**
 * This should be in game.ts
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
export function computePointsGamePlayer(game: IGame, playerIdx: number): number {

    const cardsToCount = setDiff(
        new Set(game.players[playerIdx].hand),
        new Set(enumerateMeldedHand(game.players[playerIdx].meld))
    );
    return (
        game.players[playerIdx].status === PlayerStatus.Won) ? 0
        : Math.min(
            FULL_COUNT_POINTS,
            sum(R.map(pointsOfCard)(Array.from(cardsToCount)))
        );
}
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
export function meldedHandMatchesHand(
    meldedHand: IMeldedHand,
    hand: Hand
): boolean {
    return new Set(hand) === new Set(enumerateMeldedHand(meldedHand));
}