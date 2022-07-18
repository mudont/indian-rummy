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
exports.checkHand = exports.makeMove = exports.playerFinished = exports.dealFromDeck = exports.makeGame = exports.newPlayer = exports.meldedHandMatchesHand = exports.computePoints = exports.enumerateMeldedHand = exports.makeMeldedHand = exports.makeLife = exports.makeTriplet = exports.makeSequence = exports.cardsInSequence = void 0;
const assert_1 = __importDefault(require("assert"));
const R = __importStar(require("ramda"));
const types_1 = require("./types");
const debug_1 = __importDefault(require("debug"));
const card_1 = require("./card");
const util_1 = require("./util");
const debug = (0, debug_1.default)("app:cards");
// export const GAMES: IGame[] = [];
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
    return R.map((r) => new types_1.Card(seq.suit, r))(seq.ranks);
}
exports.cardsInSequence = cardsInSequence;
/**
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
function getRestrictedView(game, playerIdx) {
    const restrictedPlayers = R.map(R.omit(["hand", "meld"]))(game.players);
    const limitedGame = R.set(card_1.gamePlayersLens, restrictedPlayers, game);
    const gameRestricted = R.omit(["deck"], limitedGame);
    gameRestricted["myHand"] =
        playerIdx >= 0 ? game.players[playerIdx].hand : undefined;
    gameRestricted["myMeld"] =
        playerIdx >= 0 ? game.players[playerIdx].meld : undefined;
    return gameRestricted;
}
/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param game
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
function makeSequence(game, cards) {
    const numCards = cards.length;
    if (numCards < 3) {
        return Error("Too Few Cards");
    }
    const nonJokers = cards.filter((c) => !(0, card_1.isJoker)(game.currJoker)(c));
    const numJokers = numCards - nonJokers.length;
    debug(`nonJokers=${JSON.stringify(nonJokers)}`);
    if (!R.all((a) => a.suit === nonJokers[0].suit)(nonJokers)) {
        return Error("Sequence can't have different suits");
    }
    if (nonJokers.length === 0) {
        return { suit: types_1.Suit.Joker, ranks: [], numJokers: cards.length };
    }
    nonJokers.sort((a, b) => (0, card_1.getRankOrdinal)(a.rank) - (0, card_1.getRankOrdinal)(b.rank));
    const ranks = nonJokers.map((c) => c.rank);
    const ordinals = ranks.map(card_1.getRankOrdinal);
    //debug(`DBG ordinals = ${JSON.stringify(ordinals)}`);
    if (nonJokers[0].rank === types_1.Rank.Ace &&
        (0, card_1.getRankOrdinal)(nonJokers[1].rank) > numJokers + 1) {
        // Move Ace to end
        ordinals.splice(0, 1);
        ordinals.push(13);
        const rankArr = ranks.splice(0, 1);
        ranks.push(rankArr[0]);
        const aceArr = nonJokers.splice(0, 1);
        nonJokers.push(aceArr[0]);
    }
    let usableJokers = numJokers;
    for (let i = 0; i < nonJokers.length - 1; i++) {
        //debug(`DBG ${ordinals[i + 1] - ordinals[i]} > ${usableJokers + 1}`);
        if (ordinals[i + 1] - ordinals[i] > 1 + usableJokers) {
            return Error("Can't make a sequence with these ranks");
        }
        usableJokers -= ordinals[i + 1] - ordinals[i] - 1;
    }
    return { suit: nonJokers[0].suit, ranks, numJokers };
}
exports.makeSequence = makeSequence;
/**
 * Make a Triplet from given cards in context of game
 * @param game
 * @param cards
 * @returns ITriplet or Error
 */
function makeTriplet(game, cards) {
    const numCards = cards.length;
    if (numCards < 3 || numCards > 4) {
        return Error("Triplet must have 3 or 4 Cards");
    }
    const nonJokers = cards.filter(R.complement((0, card_1.isJoker)(game.currJoker)));
    const numJokers = numCards - nonJokers.length;
    if (nonJokers.length === 0) {
        return { rank: types_1.Rank.Two, suits: [], numJokers: cards.length };
    }
    nonJokers.sort((a, b) => (0, card_1.getRankOrdinal)(a.rank) - (0, card_1.getRankOrdinal)(b.rank));
    const suits = nonJokers.map((c) => c.suit);
    if ((0, util_1.hasDuplicates)(suits)) {
        return Error("Triplet must have different suits");
    }
    const ordinals = cards.map((c) => (0, card_1.getRankOrdinal)(c.rank));
    for (let i = 0; i < nonJokers.length - 1; i++) {
        //debug(`DBG ${ordinals[i + 1] - ordinals[i]} > ${usableJokers + 1}`);
        if (ordinals[i + 1] - ordinals[i] !== 0) {
            return Error("Triplet must have one rank");
        }
    }
    return { rank: nonJokers[0].rank, suits, numJokers };
}
exports.makeTriplet = makeTriplet;
/**
 * Make a Life - a sequence without jokers
 * @param game
 * @param cards
 * @returns
 */
function makeLife(game, cards) {
    const seq = makeSequence(game, cards);
    if (seq instanceof Error)
        return seq;
    if (seq.numJokers > 0) {
        return Error(`Life sequence cannot have jokers`);
    }
    return R.omit(["numJokers"], seq);
}
exports.makeLife = makeLife;
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
function makeMeldedHand(sequences, triplets) {
    if (sequences.length < 2) {
        return Error(`Need at least two sequences`);
    }
    const life = R.find((s) => s.numJokers === 0, sequences);
    if (!life) {
        return Error(`Need a Life`);
    }
    let numCards = 0;
    sequences.forEach((s) => {
        numCards += s.ranks.length;
        numCards += s.numJokers;
    });
    if (numCards !== 13) {
        return Error(`Need 13 cards. have ${numCards}`);
    }
    return {
        life,
        triplets,
        sequences: sequences.filter((s) => s.numJokers > 0),
    };
}
exports.makeMeldedHand = makeMeldedHand;
/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip) {
    return R.map((s) => new types_1.Card(s, trip.rank))(trip.suits);
}
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
function enumerateMeldedHand(meldedHand) {
    var _a, _b, _c, _d;
    const jokers = R.repeat(new types_1.Card(types_1.Suit.Joker, types_1.Rank.One), (0, util_1.sum)(R.map(R.prop("numJokers"), (_a = meldedHand.triplets) !== null && _a !== void 0 ? _a : [])) +
        (0, util_1.sum)(R.map(R.prop("numJokers"), (_b = meldedHand.sequences) !== null && _b !== void 0 ? _b : [])));
    // If no life only Jokers can be used to save points
    if (!meldedHand.life) {
        return jokers;
    }
    const lifeCards = meldedHand.life ? cardsInSequence(meldedHand.life) : [];
    const sequenceCards = R.flatten(R.map(cardsInSequence, (_c = meldedHand.sequences) !== null && _c !== void 0 ? _c : []));
    // If no second sequence after Life,
    // can't use triplets to save points
    if (sequenceCards.length <= 0) {
        return jokers.concat(lifeCards);
    }
    const tripleCards = R.flatten(R.map(cardsInTriplet, (_d = meldedHand.triplets) !== null && _d !== void 0 ? _d : []));
    return jokers.concat(lifeCards, sequenceCards, tripleCards);
}
exports.enumerateMeldedHand = enumerateMeldedHand;
/**
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
function computePoints(game, playerIdx) {
    if (game.players[playerIdx].status === types_1.PlayerStatus.Won) {
        return 0;
    }
    const cardsToCount = (0, util_1.setDiff)(new Set(game.players[playerIdx].hand), new Set(enumerateMeldedHand(game.players[playerIdx].meld)));
    return Math.min(FULL_COUNT_POINTS, (0, util_1.sum)(R.map(card_1.pointsOfCard)(Array.from(cardsToCount))));
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
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
function makeGame(playerIds, currUser, gameStore) {
    const numPlayers = playerIds.length;
    const minCards = numPlayers * 13 + 10;
    const nDecks = Math.ceil(minCards / 54);
    const decks = [];
    for (let i = 0; i < nDecks; i++) {
        decks.push((0, card_1.makeDeck)());
    }
    const mergedDeck = (0, card_1.mergeDecks)(decks);
    const [usedDeck, hands, openCard, joker] = (0, exports.dealFromDeck)(mergedDeck, numPlayers, 13);
    const players = R.map((u) => newPlayer(u), playerIds);
    const id = GAMES.length;
    const game = id, state, deck, hands, melds, openPile, currJoker, players, turnPlayer, moves;
}
exports.makeGame = makeGame;
;
GAMES.push(game);
const userIdx = R.findIndex(R.propEq("user", currUser), game.players);
return getRestrictedView(game, userIdx);
/**
 * Shuffle given and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
const dealFromDeck = (deck, numPlayers, handSize = 13) => {
    (0, assert_1.default)(deck.length > numPlayers * handSize + 2);
    const shuffled = (0, card_1.shuffleDeck)(deck);
    debug(`shuffled: ${JSON.stringify(shuffled)}`);
    const hands = [];
    for (let i = 0; i < numPlayers; i++) {
        hands.push(shuffled.splice(0, handSize));
    }
    const openCardArr = shuffled.splice(0, 1);
    const jokerArr = shuffled.splice(0, 1);
    return [shuffled, hands, openCardArr[0], jokerArr[0]];
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
function makeMove(gameId, user, move) {
    const game = GAMES[gameId];
    if (!game) {
        return Error(`Invalid Game id ${gameId}`);
    }
    if (game.state === types_1.GameState.Finished) {
        return Error(`Game ${gameId} is finished`);
    }
    const playerIdx = R.findIndex(R.propEq("user", user), game.players);
    if (!playerIdx) {
        return Error("user is not a player");
    }
    const player = game.players[playerIdx];
    if (playerFinished(player)) {
        return Error("Player status doesn't allow any moves");
    }
    if (player.status === types_1.PlayerStatus.OwesCard &&
        move.moveType !== types_1.MoveType.ReturnExtraCard) {
        return Error("Player must return extra card before doing anything else");
    }
    switch (move.moveType) {
        case types_1.MoveType.Drop:
            player.points = player.moved ? MIDDLE_DROP_POINTS : INITIAL_DROP_POINTS;
            break;
        case types_1.MoveType.TakeOpen:
            // XXX TODO handle edge cases
            if (game.openPile.length === 0) {
                return Error("No Open cards yet");
            }
            game.players[playerIdx].hand.push(game.openPile.splice(-1, 1)[0]);
            player.status = types_1.PlayerStatus.OwesCard;
            break;
        case types_1.MoveType.TakeFromDeck:
            game.players[playerIdx].hand.push(game.deck.splice(0, 1)[0]);
            player.status = types_1.PlayerStatus.OwesCard;
            if (game.deck.length === 0) {
                // Deck has run out
                // Take all open cards but the top one, shuffle, and use them as deck
                const tmp = game.openPile.splice(-1, 1);
                game.deck = (0, card_1.shuffleDeck)(game.openPile);
                game.openPile = tmp;
            }
            break;
        case types_1.MoveType.ReturnExtraCard:
            if (move.cardDiscarded) {
                game.openPile.push(move.cardDiscarded);
            }
            else {
                return Error("No card returned");
            }
            game.players[playerIdx].hand = game.players[playerIdx].hand.filter((c) => c !== move.cardDiscarded);
            player.status = types_1.PlayerStatus.Active;
            break;
        case types_1.MoveType.Meld:
            if ((0, util_1.setDiff)(new Set(enumerateMeldedHand(move.meldedHand)), new Set(game.players[playerIdx].hand)).size > 0) {
                return Error("Meld contains cards not in your Hand");
            }
            game.players[playerIdx].meld = move.meldedHand;
            break;
        case types_1.MoveType.Show:
            if (!meldedHandMatchesHand(move.meldedHand, game.players[playerIdx].hand)) {
                return Error("Wrong Show");
            }
            game.players.forEach((p) => {
                p.status = types_1.PlayerStatus.Lost;
            });
            player.status = types_1.PlayerStatus.Won;
            break;
        case types_1.MoveType.Finish:
            game.players.forEach((p, idx) => {
                p.points = computePoints(game, idx);
            });
            game.state = types_1.GameState.Finished;
            break;
        default:
            return Error("Unknown move type");
        //break;
    }
    game.moves.push(move);
    player.moved = true;
    return getRestrictedView(game, playerIdx);
}
exports.makeMove = makeMove;
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
function checkHand(gameId, hand) {
    const game = GAMES[gameId];
    if (!game) {
        return Error(`Invalid Game id ${gameId}`);
    }
    return Error("Not Implemented Yet");
}
exports.checkHand = checkHand;
