"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRankSequences = exports.removeDups = exports.sequenceGaps = exports.checkIfWinningHand = exports.mkMove = exports.playerFinished = exports.dealFromDeck = exports.newPlayer = exports.meldedHandMatchesHand = exports.computePoints = exports.enumerateMeldedHand = exports.mkWinningHand = exports.mkTriplet = exports.mkLife = exports.mkSequence = exports.getRestrictedView = exports.mkGame = exports.cardsInSequence = void 0;
const R = __importStar(require("ramda"));
const types_1 = require("./types");
const debug_1 = __importDefault(require("debug"));
const card_1 = require("./card");
const util_1 = require("./util");
const E = __importStar(require("fp-ts/lib/Either"));
const function_1 = require("fp-ts/lib/function");
const N = __importStar(require("fp-ts/number"));
const ReadonlyArray_1 = require("fp-ts/lib/ReadonlyArray");
const IOE = __importStar(require("fp-ts/lib/IOEither"));
const Function_1 = require("fp-ts-std/Function");
const L = __importStar(require("monocle-ts/Lens"));
const RA = __importStar(require("fp-ts/lib/ReadonlyArray"));
const ReadonlyArray_2 = require("monocle-ts/lib/Index/ReadonlyArray");
const monocle_ts_1 = require("monocle-ts");
const debug = (0, debug_1.default)("app:cards");
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
function cardsInSequence(seq) {
    return R.map((r) => (0, card_1.mkCard)(seq.suit, r))(seq.ranks);
}
exports.cardsInSequence = cardsInSequence;
/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip) {
    return R.map((s) => (0, card_1.mkCard)(s, trip.rank))(trip.suits);
}
/**
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
function mkGame(playerIds) {
    const numPlayers = playerIds.length;
    const minCards = numPlayers * 13 + 10;
    const nDecks = Math.ceil(minCards / 54);
    const decks = Array.from({ length: nDecks }, card_1.mkDeck);
    const mergedDeck = (0, card_1.mergeDecks)(decks);
    //const [usedDeck, hands, openCard, joker] = ;
    return (0, function_1.pipe)(IOE.Do, IOE.bind("dealRes", () => (0, exports.dealFromDeck)(mergedDeck, numPlayers, 13)), IOE.bind('usedDeck', ({ dealRes }) => IOE.right(dealRes[0])), IOE.bind('hands', ({ dealRes }) => IOE.right(dealRes[1])), IOE.bind('openCard', ({ dealRes }) => IOE.right(dealRes[2])), IOE.bind('joker', ({ dealRes }) => IOE.right(dealRes[3])), IOE.chain(({ usedDeck, hands, openCard, joker }) => {
        const players = R.zipWith((player, hand) => (Object.assign(Object.assign({}, player), { hand })), R.map(newPlayer, playerIds), hands);
        const game = {
            deck: usedDeck,
            players,
            openPile: [openCard],
            wcJoker: joker,
            state: types_1.GameState.Active,
            turnPlayer: players[0].user,
            moves: [],
        };
        return IOE.right(game);
    }));
    // const userIdx = R.findIndex(R.propEq("user", currUser), game.players);
    // return getRestrictedView(game, userIdx);
}
exports.mkGame = mkGame;
/**
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
function getRestrictedView(game, playerIdx) {
    const gamePlayersLens = R.lens((R.prop('players')), R.assoc('players'));
    const restrictedPlayers = R.map(R.omit(["hand", "meld"]))(game.players);
    const limitedGame = R.set(gamePlayersLens, restrictedPlayers, game);
    const err = E.left(new Error("Invalid player index"));
    const ret = playerIdx >= 0 && playerIdx < game.players.length ? E.right(Object.assign(Object.assign({}, R.omit(["deck"], limitedGame)), { myHand: game.players[playerIdx].hand, myMeld: game.players[playerIdx].meld })) : err;
    return ret;
}
exports.getRestrictedView = getRestrictedView;
/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param wcJoker: CardI
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
function mkSequence(wcJoker, cards) {
    const numCards = cards.length;
    // See if have a sequence with jokers only
    const jokerSeq = (nonJokers) => nonJokers.length === 0 ?
        E.right({ suit: types_1.Suit.Joker, ranks: [], numJokers: cards.length }) :
        E.left(Error("No sequence with jokers"));
    const isPluralArr = (o) => o.length > 1;
    const isNotPluralArr = R.compose(R.not, isPluralArr);
    const haveAce = (ordinals) => ordinals[0] === (0, card_1.getRankOrdinal)(types_1.Rank.Ace);
    return (0, function_1.pipe)(E.of(cards.length), E.bind('nCards', E.fromPredicate(R.lt(3), () => new Error("Sequence must have at least 3 cards"))), E.bind('nonJokers', () => E.of(cards.filter((c) => !(0, card_1.isJoker)(wcJoker)(c)))), E.bind('numCards', (() => E.of(cards.length))), E.bind('numJokers', ({ nonJokers }) => E.of(numCards - nonJokers.length)), E.chain(E.fromPredicate(({ nonJokers }) => R.all((a) => a.suit === nonJokers[0].suit)(nonJokers), () => new Error("Sequence must have single suit"))), E.bind('sortedNonJokers', ({ nonJokers }) => E.of((0, ReadonlyArray_1.sort)(card_1.RankOrd)(nonJokers))), E.bind('ordinals', ({ sortedNonJokers }) => E.of(sortedNonJokers.map(c => (0, card_1.getRankOrdinal)(c.rank)))), E.chain(E.fromPredicate(({ ordinals }) => !(0, util_1.hasDuplicates)(ordinals), () => new Error("Sequence must have distinct ranks"))), E.bind('aceCloserToLastCardThanFirst', ({ ordinals }) => E.of(haveAce(ordinals) && (ordinals[1] - ordinals[0]) > (14 - ordinals[ordinals.length - 1]))), E.bind('ordinalsToCheck', ({ ordinals, aceCloserToLastCardThanFirst }) => E.of((0, Function_1.guard)([
        [isNotPluralArr, (ordinals) => ordinals],
        [() => aceCloserToLastCardThanFirst, ordinals => (0, ReadonlyArray_1.append)(ordinals[0])((0, ReadonlyArray_1.dropLeft)(1)(ordinals))],
    ])(R.identity)(ordinals))), E.chain(E.fromPredicate(({ ordinalsToCheck, numJokers }) => ordinalsToCheck[ordinalsToCheck.length - 1] - ordinalsToCheck[0] + 1 === ordinalsToCheck.length + numJokers, () => new Error("Have neither consecutive ranks nor enough jokers to fill gaps"))), E.bind('ranks', ({ nonJokers }) => E.of(nonJokers.map((c) => c.rank))), E.chain(({ nonJokers, numJokers, ranks }) => E.right({ suit: nonJokers[0].suit, ranks, numJokers })));
}
exports.mkSequence = mkSequence;
/**
 * Make a Life - a sequence without jokers
 * @param wcJoker
 * @param cards
 * @returns
 */
function mkLife(wcJoker, cards) {
    return (0, function_1.pipe)(mkSequence(wcJoker, cards), E.chain(E.fromPredicate((seq) => seq.numJokers === 0, () => new Error("Life sequence cannot have jokers"))), E.chain(seq => E.right(R.omit(["numJokers"], seq)) // { suit: seq.suit, ranks: seq.ranks })
    ));
}
exports.mkLife = mkLife;
/**
 * Make a Triplet from given cards in context of game
 * @param wcJoker
 * @param cards
 * @returns ITriplet or Error
 */
function mkTriplet(wcJoker, cards) {
    return (0, function_1.pipe)(E.Do, () => E.of(cards.length), E.chain(E.fromPredicate(R.lt(3), () => new Error("Triplet must have at least 3 cards"))), E.chain(E.fromPredicate(R.gte(4), () => new Error("Triplet must have at most 4 cards"))), E.bind('nonJokers', () => E.of(cards.filter((c) => !(0, card_1.isJoker)(wcJoker)(c)))), E.bind('numJokers', ({ nonJokers }) => E.of(cards.length - nonJokers.length)), E.bind('suits', ({ nonJokers }) => E.of(nonJokers.map((c) => c.suit))), E.bind('ranks', ({ nonJokers }) => E.of(nonJokers.map((c) => c.rank))), E.chain(E.fromPredicate((s) => !(0, util_1.hasDuplicates)(s.suits), () => new Error("Triplet must have distinct suits"))), E.chain(E.fromPredicate((s) => (0, util_1.allElemsSame)(s.ranks), () => new Error("Triplet must have single rank"))), E.chain((0, Function_1.guard)([
        [
            (s) => s.nonJokers.length === 0,
            (s) => E.right({ rank: types_1.Rank.Two, suits: [], numJokers: cards.length })
        ],
    ])((s) => E.right({ rank: s.nonJokers[0].rank, suits: s.suits, numJokers: s.numJokers }))));
}
exports.mkTriplet = mkTriplet;
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
function mkWinningHand(sequences, triplets) {
    const cardsInSeq = (set) => set.ranks.length + set.numJokers;
    const cardsInTrip = (set) => set.suits.length + set.numJokers;
    const cardsInSet = (set) => 'ranks' in set ? cardsInSeq(set) : cardsInTrip(set);
    const nCards = (0, function_1.pipe)(sequences, (0, ReadonlyArray_1.map)(cardsInSet), (0, ReadonlyArray_1.reduce)(0, (b, a) => b + a)) + (0, function_1.pipe)(triplets, (0, ReadonlyArray_1.map)(cardsInSet), (0, ReadonlyArray_1.reduce)(0, (b, a) => b + a));
    return (0, function_1.pipe)(E.Do, E.chain(E.fromPredicate(() => nCards === 13, () => new Error("Must have 13 cards"))), E.chain(E.fromPredicate(() => sequences.length >= 2, () => new Error("Must have at least 2 sequences"))), E.chain(E.fromPredicate(() => Boolean(R.find((s) => s.numJokers === 0, sequences)), () => new Error("Must have Life sequence"))), () => E.of(sequences.length + triplets.length), E.chain(() => E.of({
        life: R.find((s) => s.numJokers === 0, sequences),
        triplets,
        sequences: sequences.filter((s) => s.numJokers > 0),
    })));
}
exports.mkWinningHand = mkWinningHand;
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
function enumerateMeldedHand(meldedHand) {
    var _a, _b, _c, _d;
    const jokers = R.repeat((0, card_1.mkCard)(types_1.Suit.Joker, types_1.Rank.One), (0, util_1.sum)(R.map(R.prop("numJokers"), (_a = meldedHand.triplets) !== null && _a !== void 0 ? _a : [])) +
        (0, util_1.sum)(R.map(R.prop("numJokers"), (_b = meldedHand.sequences) !== null && _b !== void 0 ? _b : [])));
    const lifeCards = meldedHand.life ? cardsInSequence(meldedHand.life) : [];
    const sequenceCards = R.flatten(R.map(cardsInSequence, (_c = meldedHand.sequences) !== null && _c !== void 0 ? _c : []));
    const tripleCards = R.flatten(R.map(cardsInTriplet, (_d = meldedHand.triplets) !== null && _d !== void 0 ? _d : []));
    return (meldedHand.life ?
        sequenceCards.length > 0 ?
            jokers.concat(lifeCards, sequenceCards, tripleCards)
            // If no second sequence after Life,
            // can't use triplets to save points
            : jokers.concat(lifeCards)
        // If no life only Jokers can be used to save points
        : jokers);
}
exports.enumerateMeldedHand = enumerateMeldedHand;
/**
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
function computePoints(game, playerIdx) {
    const cardsToCount = (0, util_1.setDiff)(new Set(game.players[playerIdx].hand), new Set(enumerateMeldedHand(game.players[playerIdx].meld)));
    return (game.players[playerIdx].status === types_1.PlayerStatus.Won) ? 0
        : Math.min(FULL_COUNT_POINTS, (0, util_1.sum)(R.map(card_1.pointsOfCard)(Array.from(cardsToCount))));
}
exports.computePoints = computePoints;
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
function meldedHandMatchesHand(meldedHand, hand) {
    return new Set(hand) === new Set(enumerateMeldedHand(meldedHand));
}
exports.meldedHandMatchesHand = meldedHandMatchesHand;
/**
 * Make a Player
 * @param user
 * @returns
 */
function newPlayer(user) {
    return {
        user,
        status: types_1.PlayerStatus.Active,
        points: 0,
        moved: false,
        hand: [],
        meld: {},
    };
}
exports.newPlayer = newPlayer;
/**
 * Shuffle given deck and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
const dealFromDeck = (deck, numPlayers, handSize = 13) => {
    const splitDeckToHands = (deck) => {
        return R.splitEvery(handSize, deck);
    };
    return (0, function_1.pipe)(deck, IOE.fromPredicate((deck) => deck.length > numPlayers * handSize + 2, () => new Error("Not enough cards in deck")), IOE.chain((deck) => IOE.rightIO((0, card_1.shuffleDeck)(deck))), IOE.bindTo('shuffled'), IOE.bind('hands', ({ shuffled }) => IOE.right((0, function_1.pipe)(shuffled, splitDeckToHands, R.take(numPlayers)))), IOE.bind('remainingCards', ({ shuffled }) => IOE.right(R.drop(numPlayers * handSize)(shuffled))), IOE.bind('topCard', ({ remainingCards }) => IOE.right(remainingCards[0])), IOE.bind('wcJoker', ({ remainingCards }) => IOE.right(remainingCards[1])), IOE.bind('remainingDeck', ({ remainingCards }) => IOE.right(R.drop(2)(remainingCards))), IOE.chain(({ remainingDeck, hands, topCard, wcJoker }) => IOE.right([remainingDeck, hands, topCard, wcJoker])));
};
exports.dealFromDeck = dealFromDeck;
/**
 * Is player status final?
 * @param p
 * @returns
 */
function playerFinished(p) {
    return (p.status === types_1.PlayerStatus.Dropped ||
        p.status === types_1.PlayerStatus.Won ||
        p.status === types_1.PlayerStatus.Lost);
}
exports.playerFinished = playerFinished;
/**
 * Make a Rummy move. this is the only way for a Rummy game can change state
 * @param gameId
 * @param user
 * @param move
 * @returns
 */
function mkMove(game, move) {
    const playerIdx = R.findIndex(R.propEq("user", move.player), game.players);
    /**
     * Chamge turn to next active player
     */
    const nextTurn = (currPlayer) => (g) => {
        // const currPlayer = game.players[currTurn].user;
        const players = RA.filter((p) => p.status === types_1.PlayerStatus.Active || p.user === currPlayer)(g.players);
        const currPlayerIdx = R.findIndex(a => a.user === currPlayer, players);
        const nextPlayerIdx = (currPlayerIdx + 1) % players.length;
        return players[nextPlayerIdx].user;
    };
    const bumpTurn = (g) => monocle_ts_1.Lens.fromProp()('turnPlayer').set(nextTurn(g.turnPlayer)(g));
    // Lenses for modifying game state
    // TODO: No rush, but Replace R Lenses with fp-ts lenses
    const lensHand = R.lensPath(["players", playerIdx, "hand"]);
    const lensOpenPile = R.lensPath(["openPile"]);
    const lensDeck = R.lensPath(["deck"]);
    const lensPoints = R.lensPath(["players", playerIdx, "points"]);
    const removeCardFromDiscardedPile = (0, function_1.pipe)(L.id(), L.prop('openPile'), L.modify(R.drop(1)));
    const appendMove = (0, function_1.pipe)(L.id(), L.prop('moves'), L.modify((0, ReadonlyArray_1.append)(move)));
    const setMoved = monocle_ts_1.Lens.fromProp()('players')
        .composeOptional((0, ReadonlyArray_2.indexReadonlyArray)().index(playerIdx))
        .composeLens(monocle_ts_1.Lens.fromProp()('moved'))
        .set(true);
    return (0, function_1.pipe)(game, IOE.fromPredicate((game) => game.state === types_1.GameState.Active, () => new Error("Game is not active")), IOE.chain(IOE.fromPredicate((game) => game.turnPlayer === move.player, () => {
        // eslint-disable-next-line functional/no-expression-statement
        // console.log(`${move.player}, it is not your turn`)
        return new Error(`${move.player} can't play ${game.turnPlayer}'s turn`);
    })), IOE.bind('playerIdx', () => {
        const ix = R.findIndex(R.propEq("user", move.player), game.players);
        return ix < 0 ? IOE.left(new Error("Player is not in game")) : IOE.right(ix);
    }), IOE.bind('player', ({ playerIdx }) => {
        const player = game.players[playerIdx];
        return playerFinished(player) ?
            IOE.left(new Error("Player is not in game")) :
            (player.status === types_1.PlayerStatus.OwesCard &&
                move.moveType !== types_1.MoveType.ReturnExtraCard) ? IOE.left(new Error("Player must return extra card before doing anything else")) :
                IOE.right(player);
    }), IOE.chain(({ playerIdx, player }) => {
        const ret = (0, Function_1.guard)([
            // Drop
            [R.equals(types_1.MoveType.Drop), () => (0, function_1.pipe)(game, R.set(lensPoints, player.moved ? MIDDLE_DROP_POINTS : INITIAL_DROP_POINTS), bumpTurn(game), IOE.right)],
            // TakeOpen
            [R.equals(types_1.MoveType.TakeOpen), () => {
                    return IOE.right((0, function_1.pipe)(game, R.over(lensHand, R.append(game.openPile[game.openPile.length - 1])), 
                    //R.over(lensOpenPile, R.dropLast(1)),
                    removeCardFromDiscardedPile));
                }],
            // TakeFromDeck
            [R.equals(types_1.MoveType.TakeFromDeck), () => {
                    const g1 = (0, function_1.pipe)(game, R.over(lensHand, R.append(game.deck[0])), R.over(lensDeck, R.drop(1)));
                    return (g1.deck.length > 0 ? IOE.right(g1) :
                        (0, function_1.pipe)(IOE.Do, IOE.bind('g1', () => IOE.right(g1)), 
                        // IOE.bindTo<Error, IGame>('g1'),
                        IOE.bind('shuffled', ({ g1 }) => IOE.fromIO((0, card_1.shuffleDeck)(R.drop(1, g1.openPile)))), IOE.chain(({ g1, shuffled }) => (IOE.right(R.set(lensDeck, shuffled, g1)))), IOE.map(R.set(lensOpenPile, [game.openPile[0]]))));
                }],
            // ReturnExtraCard
            [R.equals(types_1.MoveType.ReturnExtraCard), () => {
                    const valid = 'cardDiscarded' in move && move.cardDiscarded;
                    return valid ?
                        ((move) => {
                            const setOwesCard = (0, function_1.pipe)(L.id(), L.prop('openPile'), L.modify((0, ReadonlyArray_1.append)(move.cardDiscarded)));
                            const setHand = monocle_ts_1.Lens.fromProp()('players')
                                .composeOptional((0, ReadonlyArray_2.indexReadonlyArray)().index(playerIdx))
                                .composeLens(monocle_ts_1.Lens.fromProp()('hand'))
                                .modify((0, ReadonlyArray_1.filter)(c => c !== move.cardDiscarded));
                            const setPlayerStatus = monocle_ts_1.Lens.fromProp()('players')
                                .composeOptional((0, ReadonlyArray_2.indexReadonlyArray)().index(playerIdx))
                                .composeLens(monocle_ts_1.Lens.fromProp()('status'))
                                .set(types_1.PlayerStatus.Active);
                            return (0, function_1.pipe)(game, setOwesCard, setHand, setPlayerStatus, bumpTurn(game), IOE.right);
                        })(move) :
                        IOE.left(new Error("Player must discard card before returning extra card"));
                }],
            // Meld
            [R.equals(types_1.MoveType.Meld), () => {
                    // to satisfy typechecker
                    const mv = move;
                    const setMeld = monocle_ts_1.Lens.fromProp()('players')
                        .composeOptional((0, ReadonlyArray_2.indexReadonlyArray)().index(playerIdx))
                        .composeLens(monocle_ts_1.Lens.fromProp()('meld'))
                        .set(mv.meldedHand);
                    const meldUsesValidCards = (0, util_1.setDiff)(new Set(enumerateMeldedHand(mv.meldedHand)), new Set(game.players[playerIdx].hand)).size > 0;
                    return !meldUsesValidCards ?
                        IOE.left(new Error("Meld contains cards not in your Hand")) :
                        IOE.right((0, function_1.pipe)(game, setMeld));
                }],
            // Show
            [R.equals(types_1.MoveType.Show), () => {
                    const cleanShow = 'meldedHand' in move &&
                        meldedHandMatchesHand(move.meldedHand, game.players[playerIdx].hand);
                    const setWinnerLosers = (0, function_1.pipe)(L.id(), L.prop('players'), L.modify((0, ReadonlyArray_1.mapWithIndex)((i, p) => {
                        const status = i === playerIdx ? types_1.PlayerStatus.Won : types_1.PlayerStatus.Lost;
                        const setStatus = (0, function_1.pipe)(L.id(), L.prop('status'), L.modify(() => status));
                        return (0, function_1.pipe)(p, setStatus);
                    })));
                    return !cleanShow ?
                        IOE.left(new Error("Meld does not match your hand")) :
                        IOE.right((0, function_1.pipe)(game, setWinnerLosers));
                }],
            // Finish
            [R.equals(types_1.MoveType.Finish), () => {
                    const setPoints = (0, function_1.pipe)(L.id(), L.prop('players'), L.modify((0, ReadonlyArray_1.mapWithIndex)((i, p) => {
                        const setPoints = (0, function_1.pipe)(L.id(), L.prop('points'), L.modify(p => computePoints(game, i)));
                        return (0, function_1.pipe)(p, setPoints);
                    })));
                    return IOE.right(setPoints(game));
                }],
        ])(() => IOE.left(new Error("Unknown move type")))(move.moveType);
        return ret;
        //return updatedGame instanceof Error ? IOE.left(updatedGame) : IOE.right(updatedGame);
    }), IOE.map(appendMove), IOE.map(setMoved));
}
exports.mkMove = mkMove;
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
function checkIfWinningHand(wcJoker, hand) {
    return E.left(new Error("Not Implemented Yet"));
}
exports.checkIfWinningHand = checkIfWinningHand;
/**
 * Find size of gaps that prevent foming a sequence from a sorted array of numbers.
 * Array of consecutive numbers will produce all zeros.
 * @param ns: readonly number[]. array of numbers
 * @returns readonly number[]. Size of gaps in consecurtive numbers
 */
function sequenceGaps(ns) {
    return (0, ReadonlyArray_1.mapWithIndex)((i, n) => i === 0 ? 0 : n - ns[i - 1] - 1)(ns);
}
exports.sequenceGaps = sequenceGaps;
function removeDups(ns) {
    return RA.sort(N.Ord)(Array.from(new Set(ns)));
}
exports.removeDups = removeDups;
function getRankSequences(ranks, maxJokers) {
    const ordinals = (0, ReadonlyArray_1.map)(card_1.getRankOrdinal)(ranks);
    const diffs = (0, function_1.flow)(removeDups, sequenceGaps)(ordinals);
    return [];
}
exports.getRankSequences = getRankSequences;
