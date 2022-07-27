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
import { append, appendW, dropLeft, reduce, sort, map } from "fp-ts/lib/ReadonlyArray";
import { fromCompare } from "fp-ts/lib/Ord";
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
): CreateGameInput {
    const numPlayers: number = playerIds.length;
    const minCards = numPlayers * 13 + 10;
    const nDecks = Math.ceil(minCards / 54);
    const decks = Array.from({ length: nDecks }, mkDeck);

    const mergedDeck = mergeDecks(decks);
    const [usedDeck, hands, openCard, joker] = dealFromDeck(
        mergedDeck,
        numPlayers,
        13
    );
    const players = R.zipWith(
        (player: IPlayer, hand: Hand) => ({ ...player, hand }),
        R.map(newPlayer, playerIds),
        hands
    );
    return {
        state: GameState.Active,
        deck: usedDeck,
        openPile: [openCard],
        currJoker: joker,
        players,
        turnPlayer: players[0],
        moves: [],
    };
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
        E.bind('ordinalsToCheck', ({ ordinals, aceCloserToLastCardThanFirst }) => E.of(R.cond([
            [isNotPluralArr, (ordinals) => ordinals],
            [() => aceCloserToLastCardThanFirst, ordinals => append(ordinals[0])(dropLeft(1)(ordinals))],
            [R.T, ordinals => ordinals],
        ])(ordinals) as readonly number[])),
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
        E.chain(R.cond([
            [(s: IScope) => s.nonJokers.length === 0, (s) => E.right({ rank: Rank.Two, suits: [], numJokers: cards.length })],
            [R.T, (s) => E.right({ rank: s.nonJokers[0].rank, suits: s.suits, numJokers: s.numJokers })],
        ])),
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
 * Shuffle given and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
export const dealFromDeck = (
    deck: Deck,
    numPlayers: number,
    handSize = 13
): readonly [Deck, readonly (readonly Card[])[], Card, Card] => {
    //assert(deck.length > numPlayers * handSize + 2);
    const shuffled = shuffleDeck(deck);
    const hands: readonly (readonly Card[])[] = pipe(
        deck,
        shuffleDeck,
        R.splitEvery(handSize),
        R.take(numPlayers)<readonly Card[]>,
    )
    const remainingCards = R.drop(numPlayers * handSize, shuffled);
    const [topCard, bottomCard] = R.take(2, remainingCards);
    const remainingDeck = R.drop(2, remainingCards);
    return [remainingDeck, hands, topCard, bottomCard];
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
    gameId: number,
    user: UserId,
    move: IMove
): GameRestricted | Error {
    const game = GAMES[gameId];
    if (!game) {
        return Error(`Invalid Game id ${gameId}`);
    }
    if (game.state === GameState.Finished) {
        return Error(`Game ${gameId} is finished`);
    }
    const playerIdx: number | undefined = R.findIndex(
        R.propEq("user", user),
        game.players
    );
    if (!playerIdx) {
        return Error("user is not a player");
    }
    const player: IPlayer = game.players[playerIdx];
    if (playerFinished(player)) {
        return Error("Player status doesn't allow any moves");
    }
    if (
        player.status === PlayerStatus.OwesCard &&
        move.moveType !== MoveType.ReturnExtraCard
    ) {
        return Error("Player must return extra card before doing anything else");
    }
    switch (move.moveType) {
        case MoveType.Drop:
            player.points = player.moved ? MIDDLE_DROP_POINTS : INITIAL_DROP_POINTS;
            break;

        case MoveType.TakeOpen:
            // XXX TODO handle edge cases
            if (game.openPile.length === 0) {
                return Error("No Open cards yet");
            }
            game.players[playerIdx].hand.push(game.openPile.splice(-1, 1)[0]);
            player.status = PlayerStatus.OwesCard;
            break;

        case MoveType.TakeFromDeck:
            game.players[playerIdx].hand.push(game.deck.splice(0, 1)[0]);
            player.status = PlayerStatus.OwesCard;
            if (game.deck.length === 0) {
                // Deck has run out
                // Take all open cards but the top one, shuffle, and use them as deck
                const tmp = game.openPile.splice(-1, 1);
                game.deck = shuffleDeck(game.openPile);
                game.openPile = tmp;
            }
            break;

        case MoveType.ReturnExtraCard:
            if (move.cardDiscarded) {
                game.openPile.push(move.cardDiscarded);
            } else {
                return Error("No card returned");
            }
            game.players[playerIdx].hand = game.players[playerIdx].hand.filter(
                (c) => c !== move.cardDiscarded
            );
            player.status = PlayerStatus.Active;
            break;

        case MoveType.Meld:
            if (
                setDiff(
                    new Set(enumerateMeldedHand(move.meldedHand)),
                    new Set(game.players[playerIdx].hand)
                ).size > 0
            ) {
                return Error("Meld contains cards not in your Hand");
            }
            game.players[playerIdx].meld = move.meldedHand;
            break;

        case MoveType.Show:
            if (
                !meldedHandMatchesHand(move.meldedHand, game.players[playerIdx].hand)
            ) {
                return Error("Wrong Show");
            }
            game.players.forEach((p) => {
                p.status = PlayerStatus.Lost;
            });
            player.status = PlayerStatus.Won;
            break;
        case MoveType.Finish:
            game.players.forEach((p, idx) => {
                p.points = computePoints(game, idx);
            });
            game.state = GameState.Finished;
            break;
        default:
            return Error("Unknown move type");
        //break;
    }
    game.moves.push(move);
    player.moved = true;
    return getRestrictedView(game, playerIdx);
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

export function checkHand(gameId: number, hand: Hand): IMeldedHand | Error {
    const game = GAMES[gameId];
    if (!game) {
        return Error(`Invalid Game id ${gameId}`);
    }

    return Error("Not Implemented Yet");
}
