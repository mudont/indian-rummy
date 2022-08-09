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
import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as N from "fp-ts/number"
import { traceWithValue, trace } from "fp-ts-std/Debug";
import { Do } from "fp-ts-contrib/lib/Do";
import { append, appendW, dropLeft, reduce, sort, map, mapWithIndex, filter } from "fp-ts/lib/ReadonlyArray";
import { fromCompare } from "fp-ts/lib/Ord";
import * as IO from "fp-ts/lib/IO";
import * as IOE from "fp-ts/lib/IOEither";
import { guard } from 'fp-ts-std/Function'
import * as L from "monocle-ts/Lens"
import { indexArray } from "monocle-ts/lib/Index/Array"
import * as RA from "fp-ts/lib/ReadonlyArray";
import { indexReadonlyArray } from 'monocle-ts/lib/Index/ReadonlyArray'

import { Lens, Prism, fromTraversable } from 'monocle-ts'

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
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip: ITriplet): readonly Card[] {
    return R.map((s: NonJokerSuit) => mkCard(s as Suit, trip.rank))(trip.suits);
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
                    wcJoker: joker,
                    state: GameState.Active,
                    turnPlayer: players[0].user,
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
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
export function getRestrictedView(game: IGame, playerIdx: number): E.Either<Error, GameRestricted> {

    const gamePlayersLens = R.lens(R.prop('players')<unknown>, R.assoc('players'));
    const restrictedPlayers = R.map(R.omit(["hand", "meld"]))(game.players);

    const limitedGame = R.set(gamePlayersLens, restrictedPlayers, game);
    const err = E.left(new Error("Invalid player index"));
    const ret = playerIdx >= 0 && playerIdx < game.players.length ? E.right({
        ...R.omit(
            ["deck"],
            limitedGame as GameRestricted
        ),
        myHand: game.players[playerIdx].hand,
        myMeld: game.players[playerIdx].meld,
    }) : err;
    return ret;
}

/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param wcJoker: CardI
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
export function mkSequence(
    wcJoker: Card,
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
        E.bind('nCards',
            E.fromPredicate(R.lt(3), () => new Error("Sequence must have at least 3 cards"))),
        E.bind('nonJokers',
            () => E.of(cards.filter((c) => !isJoker(wcJoker)(c)))),
        E.bind('numCards',
            (() => E.of(cards.length))),
        E.bind('numJokers',
            ({ nonJokers }: Readonly<{ readonly nonJokers: readonly Card[] }>) =>
                E.of(numCards - nonJokers.length)),
        E.chain(E.fromPredicate(({ nonJokers }) =>
            R.all((a: Card) => a.suit === nonJokers[0].suit)(nonJokers),
            () => new Error("Sequence must have single suit"))
        ),
        E.bind('sortedNonJokers',
            ({ nonJokers }) => E.of(sort(RankOrd)(nonJokers))),
        E.bind('ordinals',
            ({ sortedNonJokers }) => E.of(sortedNonJokers.map(c => getRankOrdinal(c.rank)))),
        E.chain(E.fromPredicate(({ ordinals }) =>
            !hasDuplicates(ordinals),
            () => new Error("Sequence must have distinct ranks"))
        ),
        E.bind('aceCloserToLastCardThanFirst',
            ({ ordinals }) =>
                E.of(haveAce(ordinals) && (ordinals[1] - ordinals[0]) > (14 - ordinals[ordinals.length - 1]))
        ),
        E.bind('ordinalsToCheck',
            ({ ordinals, aceCloserToLastCardThanFirst }) => E.of(guard([
                [isNotPluralArr, (ordinals) => ordinals],
                [() => aceCloserToLastCardThanFirst, ordinals => append(ordinals[0])(dropLeft(1)(ordinals))],
            ])(R.identity)(ordinals) as readonly number[])),
        E.chain(E.fromPredicate(({ ordinalsToCheck, numJokers }: Pick<IScope, "ordinalsToCheck" | "numJokers">) =>
            ordinalsToCheck[ordinalsToCheck.length - 1] - ordinalsToCheck[0] + 1 === ordinalsToCheck.length + numJokers,
            () => new Error("Have neither consecutive ranks nor enough jokers to fill gaps"))
        ),
        E.bind('ranks',
            ({ nonJokers }) => E.of(nonJokers.map((c) => c.rank))),
        E.chain(
            ({ nonJokers, numJokers, ranks }: IScope) => E.right({ suit: nonJokers[0].suit, ranks, numJokers })
        )
    )
}

/**
 * Make a Life - a sequence without jokers
 * @param wcJoker
 * @param cards
 * @returns
 */
export function mkLife(wcJoker: Card, cards: readonly Card[]): E.Either<Error, ILife> {
    return pipe(
        mkSequence(wcJoker, cards),
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
 * @param wcJoker
 * @param cards
 * @returns ITriplet or Error
 */
export function mkTriplet(
    wcJoker: Card,
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
        E.bind('nonJokers', () => E.of(cards.filter((c) => !isJoker(wcJoker)(c)))),
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
export function mkWinningHand(
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
    move: IMove
): IOE.IOEither<Error, IGame> {
    type CondLeft = (value: MoveType) => value is MoveType;
    type CondRight = (value: MoveType) => IGame;
    const playerIdx = R.findIndex(
        R.propEq("user", move.player),
        game.players
    );

    /**
     * Chamge turn to next active player
     */
    const nextTurn = (currPlayer: UserId) => (g: IGame): UserId => {
        // const currPlayer = game.players[currTurn].user;
        const players: readonly IPlayer[] = RA.filter<IPlayer>(
            (p: IPlayer) => p.status === PlayerStatus.Active || p.user === currPlayer)(g.players)
        const currPlayerIdx = R.findIndex(a => a.user === currPlayer, players);
        const nextPlayerIdx = (currPlayerIdx + 1) % players.length;
        return players[nextPlayerIdx].user;
    }

    const bumpTurn = (g: IGame) => Lens.fromProp<IGame>()('turnPlayer').set(nextTurn(g.turnPlayer)(g))

    // Lenses for modifying game state
    // TODO: No rush, but Replace R Lenses with fp-ts lenses
    const lensHand = R.lensPath<IGame, Hand>(["players", playerIdx, "hand"]);
    const lensOpenPile = R.lensPath<IGame, readonly Card[]>(["openPile"]);
    const lensDeck = R.lensPath<IGame, Deck>(["deck"]);
    const lensPoints = R.lensPath<IGame, number>(["players", playerIdx, "points"]);
    const removeCardFromDiscardedPile = pipe(
        L.id<IGame>(),
        L.prop('openPile'),
        L.modify(R.drop(1)),
    )
    const appendMove = pipe(
        L.id<IGame>(),
        L.prop('moves'),
        L.modify(append(move)),
    )
    const setMoved = Lens.fromProp<IGame>()('players')
        .composeOptional(
            indexReadonlyArray<IPlayer>().index(playerIdx)
        )
        .composeLens(Lens.fromProp<IPlayer>()('moved'))
        .set(true);

    return pipe(
        game,
        IOE.fromPredicate((game: IGame) => game.state === GameState.Active, () =>
            new Error("Game is not active")
        ),
        IOE.chain(
            IOE.fromPredicate((game: IGame) => game.turnPlayer === move.player, () => {
                // eslint-disable-next-line functional/no-expression-statement
                // console.log(`${move.player}, it is not your turn`)
                return new Error(`${move.player} can't play ${game.turnPlayer}'s turn`)
            }
            )
        ),
        IOE.bind('playerIdx', () => {
            const ix = R.findIndex(
                R.propEq("user", move.player),
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
                const ret: IOE.IOEither<Error, IGame> = guard([
                    // Drop
                    [R.equals(MoveType.Drop) as CondLeft, () =>
                        pipe(
                            game,
                            R.set(lensPoints, player.moved ? MIDDLE_DROP_POINTS : INITIAL_DROP_POINTS),
                            bumpTurn(game),
                            IOE.right
                        )
                    ],
                    // TakeOpen
                    [R.equals(MoveType.TakeOpen) as CondLeft, () => {
                        return IOE.right(pipe(
                            game,
                            R.over(lensHand, R.append(game.openPile[game.openPile.length - 1])),
                            //R.over(lensOpenPile, R.dropLast(1)),
                            removeCardFromDiscardedPile,
                        ))
                    }],
                    // TakeFromDeck
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
                    // ReturnExtraCard
                    [R.equals(MoveType.ReturnExtraCard) as CondLeft, () => {
                        const valid = 'cardDiscarded' in move && move.cardDiscarded;
                        return valid ?
                            ((move) => {
                                const setOwesCard = pipe(
                                    L.id<IGame>(),
                                    L.prop('openPile'),
                                    L.modify(append(move.cardDiscarded)),
                                );
                                const setHand = Lens.fromProp<IGame>()('players')
                                    .composeOptional(
                                        indexReadonlyArray<IPlayer>().index(playerIdx)
                                    )
                                    .composeLens(Lens.fromProp<IPlayer>()('hand'))
                                    .modify(filter(c => c !== move.cardDiscarded))
                                const setPlayerStatus = Lens.fromProp<IGame>()('players')
                                    .composeOptional(
                                        indexReadonlyArray<IPlayer>().index(playerIdx)
                                    )
                                    .composeLens(Lens.fromProp<IPlayer>()('status'))
                                    .set(PlayerStatus.Active);
                                return pipe(game, setOwesCard, setHand, setPlayerStatus, bumpTurn(game), IOE.right);
                            })(move) :
                            IOE.left(new Error("Player must discard card before returning extra card"))
                    }],
                    // Meld
                    [R.equals(MoveType.Meld) as CondLeft, () => {
                        // to satisfy typechecker
                        const mv: IMoveMeld = move as IMoveMeld;

                        const setMeld = Lens.fromProp<IGame>()('players')
                            .composeOptional(
                                indexReadonlyArray<IPlayer>().index(playerIdx)
                            )
                            .composeLens(Lens.fromProp<IPlayer>()('meld'))
                            .set(mv.meldedHand);

                        const meldUsesValidCards = setDiff(
                            new Set(enumerateMeldedHand(mv.meldedHand)),
                            new Set(game.players[playerIdx].hand)
                        ).size > 0;
                        return !meldUsesValidCards ?
                            IOE.left(new Error("Meld contains cards not in your Hand")) :
                            IOE.right(pipe(game, setMeld))
                    }],
                    // Show
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
                                    L.modify(() => status),
                                );
                                return pipe(p, setStatus);
                            })));
                        return !cleanShow ?
                            IOE.left(new Error("Meld does not match your hand")) :
                            IOE.right(pipe(game, setWinnerLosers));
                    }],
                    // Finish
                    [R.equals(MoveType.Finish) as CondLeft, () => {
                        const setPoints = pipe(
                            L.id<IGame>(),
                            L.prop('players'),
                            L.modify(mapWithIndex((i, p) => {
                                const setPoints = pipe(
                                    L.id<IPlayer>(),
                                    L.prop('points'),
                                    L.modify(p => computePoints(game, i)),
                                );
                                return pipe(p, setPoints);
                            })));

                        return IOE.right(setPoints(game))
                    }],
                ])(() => IOE.left(new Error("Unknown move type")))(move.moveType);
                return ret;
                //return updatedGame instanceof Error ? IOE.left(updatedGame) : IOE.right(updatedGame);
            }
        ),
        IOE.map(appendMove),
        IOE.map(setMoved),
    )
}
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
 * TODO: Implement. Some pointers in links below.
 * https://stackoverflow.com/questions/51225335/determine-if-an-indian-rummy-hand-is-a-winning-hand-java
 * http://pds2.egloos.com/pds/200611/17/89/solving%20rummikub%20problems%20by%20integer%20linear%20programming.pdf
 * Rules:
 * At least
 * @param wcJoker: Card
 * @param hand: Hand - The hand to check
 * @returns melded hand if it is a winning hand, error otherwise
 */

export function checkIfWinningHand(wcJoker: Card, hand: Hand): E.Either<Error, IMeldedHand> {

    return E.left(new Error("Not Implemented Yet"));
}

/**
 * Find size of gaps that prevent foming a sequence from a sorted array of numbers.
 * Array of consecutive numbers will produce all zeros.
 * @param ns: readonly number[]. array of numbers
 * @returns readonly number[]. Size of gaps in consecurtive numbers
 */
export function sequenceGaps(ns: readonly number[]): readonly number[] {
    return mapWithIndex<number, number>((i, n) => i === 0 ? 0 : n - ns[i - 1] - 1)(ns);
}
export function removeDups(ns: readonly number[]): readonly number[] {
    return RA.sort(N.Ord)(Array.from(new Set(ns)));
}

export function getRankSequences(ranks: readonly Rank[], maxJokers: number): readonly Rank[] {
    const ordinals = map(getRankOrdinal)(ranks);
    const diffs = flow(removeDups, sequenceGaps)(ordinals);

    return []
}