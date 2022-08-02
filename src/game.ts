import assert from "assert";
import * as R from "ramda";
import {
    Card,
    CreateGameInput,
    Deck,
    GameRestricted,
    GameState,
    Hand,
    IGame,
    IGameStore,
    ILife,
    IMeldedHand,
    IMove,
    IMoveMeld,
    IPlayer,
    ISequence,
    ITriplet,
    MoveType,
    NonJokerRank,
    NonJokerSuit,
    PlayerStatus,
    Rank,
    Suit,
    UserId,
} from "./types";
import Dbg from "debug";
import {
    gamePlayersLens,
    isJoker,
    getRankOrdinal,
    pointsOfCard,
    mergeDecks,
    shuffleDeck,
    mkCard,
    mkDeck,
    RankOrd,
} from "./card";
import { hasDuplicates, allElemsSame, hasDistinctElems, sum, setDiff } from "./util";
import E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import T from "fp-ts/lib/Task";
import TE from "fp-ts/lib/TaskEither";
import N from "fp-ts/number"
import { traceWithValue, trace } from "fp-ts-std/Debug";
import { Do } from "fp-ts-contrib/lib/Do";
import { append, appendW, dropLeft, reduce, sort, map, mapWithIndex, filter } from "fp-ts/lib/ReadonlyArray";
import { fromCompare } from "fp-ts/lib/Ord";
import * as IO from "fp-ts/lib/IO";
import * as IOE from "fp-ts/lib/IOEither";
import { guard } from 'fp-ts-std/Function'
import * as L from "monocle-ts/Lens"

const debug = Dbg("app:cards");


const MIDDLE_DROP_POINTS = 50;
const INITIAL_DROP_POINTS = 25;
const FULL_COUNT_POINTS = 80;

/************************************************************
 * Core Game functions
 ************************************************************/
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
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
function getRestrictedView(game: IGame, playerIdx: number) {
    const restrictedPlayers = R.map(R.omit(["hand", "meld"]))(game.players);
    const limitedGame = R.set(gamePlayersLens, restrictedPlayers, game);
    return {
        ...R.omit(
            ["deck"],
            limitedGame as GameRestricted
        ),
        myHand: playerIdx >= 0 ? game.players[playerIdx].hand : undefined,
        myMeld: playerIdx >= 0 ? game.players[playerIdx].meld : undefined,
    }
}

/**
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
export function mkGame(
    playerIds: readonly UserId[]
): IOE.IOEither<Error, CreateGameInput> {
    const numPlayers: number = playerIds.length;
    const minCards = numPlayers * 13 + 10;
    const nDecks = Math.ceil(minCards / 54);
    const decks = Array.from({ length: nDecks }, mkDeck);

    const mergedDeck = mergeDecks(decks);
    //const [usedDeck, hands, openCard, joker] = ;
    return pipe(
        IOE.Do,
        IOE.bind("dealRes", () => dealFromDeck(
            mergedDeck,
            numPlayers,
            13
        )),
        IOE.bind('usedDeck', ({ dealRes }) => IOE.right(dealRes[0])),
        IOE.bind('hands', ({ dealRes }) => IOE.right(dealRes[1])),
        IOE.bind('openCard', ({ dealRes }) => IOE.right(dealRes[2])),
        IOE.bind('joker', ({ dealRes }) => IOE.right(dealRes[3])),
        IOE.chain(
            ({ usedDeck, hands, openCard, joker }) => {
                const players = R.zipWith(
                    (player: IPlayer, hand: Hand) => ({ ...player, hand }),
                    R.map(newPlayer, playerIds),
                    hands
                );
                const game: CreateGameInput = {
                    deck: usedDeck,
                    players,
                    openPile: [openCard],
                    currJoker: joker,
                    state: GameState.Active,
                    turnPlayer: players[0],
                    moves: [],
                };
                return IOE.right(game);
            }
        )
    )

    // const userIdx = R.findIndex(R.propEq("user", currUser), game.players);
    // return getRestrictedView(game, userIdx);
}

/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param game
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
export function mkSequence(
    game: GameRestricted,
    cards: readonly Card[]
): E.Either<Error, ISequence> {
    const numCards: number = cards.length;

    // See if have a sequence with jokers only
    const jokerSeq = (nonJokers: readonly Card[]): E.Either<Error, ISequence> =>
        nonJokers.length === 0 ?
            E.right({ suit: Suit.Joker, ranks: [], numJokers: cards.length }) :
            E.left(Error("No sequence with jokers"));

    const isPluralArr = (o: ReadonlyArray<unknown>) => o.length > 1
    const isNotPluralArr = R.compose(R.not, isPluralArr)
    const haveAce = (ordinals: readonly number[]) => ordinals[0] === getRankOrdinal(Rank.Ace);

    interface IScope {
        readonly nonJokers:
        readonly Card[];
        readonly numJokers: number;
        readonly sortedNonJokers:
        readonly Card[];
        readonly ordinals: readonly number[];
        readonly aceCloserToLastCardThanFirst: boolean;
        readonly ordinalsToCheck: readonly number[];
        readonly ranks: readonly Rank[];
    }

    return pipe(
        E.of(cards.length),
        E.bind('nCards', E.fromPredicate(R.lt(3), () => new Error("Sequence must have at least 3 cards"))),
        E.bind('nonJokers', () => E.of(cards.filter((c) => !isJoker(game.currJoker)(c)))),
        E.bind('numCards', (() => E.of(cards.length))),
        E.bind('numJokers', ({ nonJokers }: Readonly<{ readonly nonJokers: readonly Card[] }>) =>
            E.of(numCards - nonJokers.length)),
        E.chain(E.fromPredicate(({ nonJokers }) =>
            R.all((a: Card) => a.suit === nonJokers[0].suit)(nonJokers),
            () => new Error("Sequence must have single suit"))
        ),
        E.bind('sortedNonJokers', ({ nonJokers }) => E.of(sort(RankOrd)(nonJokers))),
        E.bind('ordinals', ({ sortedNonJokers }) => E.of(sortedNonJokers.map(c => getRankOrdinal(c.rank)))),
        E.chain(E.fromPredicate(({ ordinals }) =>
            !hasDuplicates(ordinals),
            () => new Error("Sequence must have distinct ranks"))
        ),
        E.bind('aceCloserToLastCardThanFirst', ({ ordinals }) =>
            E.of(haveAce(ordinals) && (ordinals[1] - ordinals[0]) > (14 - ordinals[ordinals.length - 1]))
        ),
        E.bind('ordinalsToCheck', ({ ordinals, aceCloserToLastCardThanFirst }) => E.of(guard([
            [isNotPluralArr, (ordinals) => ordinals],
            [() => aceCloserToLastCardThanFirst, ordinals => append(ordinals[0])(dropLeft(1)(ordinals))],
        ])(R.identity)(ordinals) as readonly number[])),
        E.chain(E.fromPredicate(({ ordinalsToCheck, numJokers }: Pick<IScope, "ordinalsToCheck" | "numJokers">) =>
            ordinalsToCheck[ordinalsToCheck.length - 1] - ordinalsToCheck[0] + 1 === ordinalsToCheck.length + numJokers,
            () => new Error("Have neither consecutive ranks nor enough jokers to fill gaps"))
        ),
        E.bind('ranks', ({ nonJokers }) => E.of(nonJokers.map((c) => c.rank))),
        E.chain(
            ({ nonJokers, numJokers, ranks }: IScope) => E.right({ suit: nonJokers[0].suit, ranks, numJokers })
        )
    )
}

/**
 * Make a Life - a sequence without jokers
 * @param game
 * @param cards
 * @returns
 */
export function mkLife(game: GameRestricted, cards: readonly Card[]): E.Either<Error, ILife> {
    return pipe(
        mkSequence(game, cards),
        E.chain(E.fromPredicate(
            (seq) => seq.numJokers === 0,
            () => new Error("Life sequence cannot have jokers"))
        ),
        E.chain(
            seq => E.right(R.omit(["numJokers"], seq)) // { suit: seq.suit, ranks: seq.ranks })
        )
    )
}

/**
 * Make a Triplet from given cards in context of game
 * @param game
 * @param cards
 * @returns ITriplet or Error
 */
export function mkTriplet(
    game: GameRestricted,
    cards: readonly Card[]
): E.Either<Error, ITriplet> {
    interface IScope {
        readonly nonJokers: readonly Card[];
        readonly numJokers: number;
        readonly suits: readonly Suit[];
        readonly ranks: readonly Rank[];
    }
    return pipe(
        E.Do,
        () => E.of(cards.length),
        E.chain(E.fromPredicate(R.lt(3), () => new Error("Triplet must have at least 3 cards"))),
        E.chain(E.fromPredicate(R.gte(4), () => new Error("Triplet must have at most 4 cards"))),
        E.bind('nonJokers', () => E.of(cards.filter((c) => !isJoker(game.currJoker)(c)))),
        E.bind('numJokers', ({ nonJokers }: Readonly<{ readonly nonJokers: readonly Card[] }>) =>
            E.of(cards.length - nonJokers.length)),
        E.bind('suits', ({ nonJokers }) => E.of(nonJokers.map((c) => c.suit))),
        E.bind('ranks', ({ nonJokers }) => E.of(nonJokers.map((c) => c.rank))),
        E.chain(E.fromPredicate((s) => !hasDuplicates(s.suits), () => new Error("Triplet must have distinct suits"))),
        E.chain(E.fromPredicate((s) => allElemsSame(s.ranks), () => new Error("Triplet must have single rank"))),
        E.chain(

            guard<IScope, E.Either<Error, ITriplet>>([
                [
                    (s: IScope) => s.nonJokers.length === 0,
                    (s) => E.right({ rank: Rank.Two, suits: [], numJokers: cards.length })
                ],
            ])((s) => E.right({ rank: s.nonJokers[0].rank, suits: s.suits, numJokers: s.numJokers }))
        ),
    );
}

/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export function mkMeldedHand(
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
        })),
    )
}

/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip: ITriplet): readonly Card[] {
    return R.map((s: NonJokerSuit) => mkCard(s as Suit, trip.rank))(trip.suits);
}

/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export function enumerateMeldedHand(meldedHand: IMeldedHand): readonly Card[] {
    const jokers = R.repeat(
        mkCard(Suit.Joker, Rank.One),
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
/**
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
export function computePoints(game: IGame, playerIdx: number): number {

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
/**
 * Make a Player
 * @param user
 * @returns
 */
export function newPlayer(user: UserId): IPlayer {
    return {
        user,
        status: PlayerStatus.Active,
        points: 0,
        moved: false,
        hand: [],
        meld: {},
    };
}
/**
 * Shuffle given deck and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
export const dealFromDeck = (
    deck: Deck,
    numPlayers: number,
    handSize = 13
): IOE.IOEither<Error, readonly [Deck, readonly (readonly Card[])[], Card, Card]> => {

    const splitDeckToHands = (deck: Deck): readonly (Hand)[] => {
        return R.splitEvery<Card>(handSize, deck) as readonly (Hand)[]
    }
    return pipe(
        deck,
        IOE.fromPredicate((deck: Deck) => deck.length > numPlayers * handSize + 2, () => new Error("Not enough cards in deck")),
        IOE.chain((deck: Deck) => IOE.rightIO(shuffleDeck(deck))),
        IOE.bindTo('shuffled'),
        IOE.bind('hands', ({ shuffled }) =>
            IOE.right(pipe(
                shuffled,
                splitDeckToHands,
                R.take<readonly Card[]>(numPlayers)
            )),
        ),
        IOE.bind('remainingCards', ({ shuffled }) =>
            IOE.right(R.drop<Card>(numPlayers * handSize)(shuffled))
        ),
        IOE.bind('topCard', ({ remainingCards }) =>
            IOE.right(remainingCards[0])
        ),
        IOE.bind('wcJoker', ({ remainingCards }) =>
            IOE.right(remainingCards[1])
        ),
        IOE.bind('remainingDeck', ({ remainingCards }) =>
            IOE.right(R.drop<Card>(2)(remainingCards))
        ),
        IOE.chain(({ remainingDeck, hands, topCard, wcJoker }) =>
            IOE.right([remainingDeck, hands, topCard, wcJoker])
        )
    )
};

/**
 * Is player status final?
 * @param p
 * @returns
 */
export function playerFinished(p: IPlayer): boolean {
    return (
        p.status === PlayerStatus.Dropped ||
        p.status === PlayerStatus.Won ||
        p.status === PlayerStatus.Lost
    );
}
/**
 * Make a Rummy move. this is the only way for a Rummy game can change state
 * @param gameId
 * @param user
 * @param move
 * @returns
 */
export function mkMove(
    game: IGame,
    user: UserId,
    move: IMove
): IOE.IOEither<Error, IGame> {
    type CondLeft = (value: MoveType) => value is MoveType;
    type CondRight = (value: MoveType) => IGame;
    const playerIdx = R.findIndex(
        R.propEq("user", user),
        game.players
    );
    const gameAfterMove: IOE.IOEither<Error, IGame> = pipe(
        game,
        IOE.fromPredicate((game: IGame) => game.state === GameState.Active, () =>
            new Error("Game is not active")
        ),
        IOE.bind('playerIdx', () => {
            const ix = R.findIndex(
                R.propEq("user", user),
                game.players
            );
            return ix < 0 ? IOE.left(new Error("Player is not in game")) : IOE.right(ix)
        }),
        IOE.bind('player', ({ playerIdx }) => {
            const player: IPlayer = game.players[playerIdx];
            return playerFinished(player) ?
                IOE.left(new Error("Player is not in game")) :
                (
                    player.status === PlayerStatus.OwesCard &&
                    move.moveType !== MoveType.ReturnExtraCard
                ) ? IOE.left(new Error("Player must return extra card before doing anything else")) :
                    IOE.right(player)
        }),
        IOE.chain(
            ({ playerIdx, player }): IOE.IOEither<Error, IGame> => {
                const lensHand = R.lensPath<IGame, Hand>(["players", playerIdx, "hand"]);
                const lensOpenPile = R.lensPath<IGame, readonly Card[]>(["openPile"]);
                const lensDeck = R.lensPath<IGame, Deck>(["deck"]);
                const lensPoints = R.lensPath<IGame, number>(["players", playerIdx, "points"]);
                const removeCardFromDiscardedPile = pipe(
                    L.id<IGame>(),
                    L.prop('openPile'),
                    L.modify(R.drop(1)),
                )
                const ret: IOE.IOEither<Error, IGame> = guard([
                    [R.equals(MoveType.Drop) as CondLeft, () => {
                        return IOE.right(R.set(lensPoints, player.moved ? MIDDLE_DROP_POINTS : INITIAL_DROP_POINTS, game))
                    }],
                    [R.equals(MoveType.TakeOpen) as CondLeft, () => {
                        return IOE.right(pipe(
                            game,
                            R.over(lensHand, R.append(game.openPile[game.openPile.length - 1])),
                            //R.over(lensOpenPile, R.dropLast(1)),
                            removeCardFromDiscardedPile,
                        ))
                    }],
                    [R.equals(MoveType.TakeFromDeck) as CondLeft, () => {
                        const g1 = pipe(
                            game,
                            R.over(lensHand, R.append(game.deck[0])),
                            R.over(lensDeck, R.drop(1)),
                        );
                        return (g1.deck.length > 0 ? IOE.right(g1) :
                            pipe(
                                IOE.Do,
                                IOE.bind('g1', () => IOE.right(g1)),
                                // IOE.bindTo<Error, IGame>('g1'),
                                IOE.bind('shuffled',
                                    ({ g1 }: { readonly g1: IGame }) =>
                                        IOE.fromIO<Deck, Error>(shuffleDeck(R.drop(1, g1.openPile)))),
                                IOE.chain(({ g1, shuffled }: { readonly g1: IGame, readonly shuffled: Deck }) => (
                                    IOE.right(R.set(lensDeck, shuffled, g1))
                                )),
                                IOE.map(R.set(lensOpenPile, [game.openPile[0]])),
                            ))

                    }],
                    [R.equals(MoveType.ReturnExtraCard) as CondLeft, () => {
                        const valid = 'cardDiscarded' in move && move.cardDiscarded;
                        return valid ?
                            (() => {
                                const setOwesCard = pipe(
                                    L.id<IGame>(),
                                    L.prop('openPile'),
                                    L.modify(append(move.cardDiscarded)),
                                );
                                const setHand = pipe(
                                    L.id<IGame>(),
                                    L.prop('players'),
                                    L.prop(playerIdx),
                                    L.prop('hand'),
                                    L.modify(filter(c => c !== move.cardDiscarded)));

                                const setPlayerStatus = pipe(
                                    L.id<IGame>(),
                                    L.prop('players'),
                                    L.prop(playerIdx),
                                    L.prop('status'),
                                    L.modify(s => PlayerStatus.Active));
                                return IOE.right(pipe(game, setOwesCard, setHand, setPlayerStatus));
                            })() :
                            IOE.left(new Error("Player must discard card before returning extra card"))
                    }],
                    [R.equals(MoveType.Meld) as CondLeft, () => {
                        // to satisfy typechecker
                        const mv: IMoveMeld = move as IMoveMeld;
                        const setMeld = pipe(
                            L.id<IGame>(),
                            L.prop('players'),
                            L.prop(playerIdx),
                            L.prop('meld'),
                            L.modify(m => mv.meldedHand));
                        const meldUsesValidCards = setDiff(
                            new Set(enumerateMeldedHand(mv.meldedHand)),
                            new Set(game.players[playerIdx].hand)
                        ).size > 0;
                        return !meldUsesValidCards ?
                            IOE.left(new Error("Meld contains cards not in your Hand")) :
                            IOE.right(pipe(game, setMeld))
                    }],
                    [R.equals(MoveType.Show) as CondLeft, () => {
                        const cleanShow = 'meldedHand' in move &&
                            meldedHandMatchesHand(move.meldedHand, game.players[playerIdx].hand)
                        const setWinnerLosers = pipe(
                            L.id<IGame>(),
                            L.prop('players'),
                            L.modify(mapWithIndex((i, p) => {
                                const status = i === playerIdx ? PlayerStatus.Won : PlayerStatus.Lost;
                                const setStatus = pipe(
                                    L.id<IPlayer>(),
                                    L.prop('status'),
                                    L.modify(s => status),
                                );
                                return pipe(p, setStatus);
                            })));
                        return !cleanShow ?
                            IOE.left(new Error("Meld does not match your hand")) :
                            IOE.right(pipe(game, setWinnerLosers));
                    }],
                    [R.equals(MoveType.Finish) as CondLeft, () => {
                        const setPoints = pipe(
                            L.id<IGame>(),
                            L.prop('players'),
                            L.modify(mapWithIndex((i, p) => {
                                const status = i === playerIdx ? PlayerStatus.Won : PlayerStatus.Lost;
                                const setPoints = pipe(
                                    L.id<IPlayer>(),
                                    L.prop('points'),
                                    L.modify(p => computePoints(game, i)),
                                );
                                return pipe(p, setPoints);
                            })));

                        return IOE.right(game)
                    }],
                ])(() => IOE.left(new Error("Unknown move type")))(move.moveType);
                return ret;
                //return updatedGame instanceof Error ? IOE.left(updatedGame) : IOE.right(updatedGame);
            }
        ),
    )
    const appendMove = pipe(
        L.id<IGame>(),
        L.prop('moves'),
        L.modify(append(move)),
    )
    const setMoved = pipe(
        L.id<IGame>(),
        L.prop('players'),
        L.prop(playerIdx),
        L.prop('moved'),
        L.modify(() => true),
    )
    //     game.moves.push(move);
    // player.moved = true;
    // return getRestrictedView(game, playerIdx);
    return pipe(
        gameAfterMove,
        IOE.map(appendMove),
        IOE.map(setMoved),
    );
    // return IOE.left(new Error("mkMove not implemented"));
}

/**
 * Check if this is a winning hand.
 * https://stackoverflow.com/questions/51225335/determine-if-an-indian-rummy-hand-is-a-winning-hand-java
 * http://pds2.egloos.com/pds/200611/17/89/solving%20rummikub%20problems%20by%20integer%20linear%20programming.pdf
 * Rules:
 * At least
 * @param gameId
 * @param hand
 * @returns melded hand
 */

export function checkHand(game: IGame, hand: Hand): IOE.IOEither<Error, IMeldedHand> {

    return IOE.left(new Error("Not Implemented Yet"));
}
