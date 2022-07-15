import assert from "assert";
import * as R from "ramda";
import Dbg from "debug";
const debug = Dbg("app:cards");
export const GAMES = [];
const MIDDLE_DROP_POINTS = 50;
const INITIAL_DROP_POINTS = 25;
const FULL_COUNT_POINTS = 80;
// ♣♦♥♠  ♧♢♡♤
export var Suit;
(function (Suit) {
    Suit["Clubs"] = "C";
    Suit["Diamonds"] = "D";
    Suit["Hearts"] = "H";
    Suit["Spades"] = "S";
    Suit["Joker"] = "J";
})(Suit || (Suit = {}));
export var Rank;
(function (Rank) {
    Rank["Ace"] = "A";
    Rank["One"] = "1";
    Rank["Two"] = "2";
    Rank["Three"] = "3";
    Rank["Four"] = "4";
    Rank["Five"] = "5";
    Rank["Six"] = "6";
    Rank["Seven"] = "7";
    Rank["Eight"] = "8";
    Rank["Nine"] = "9";
    Rank["Ten"] = "T";
    Rank["Jack"] = "J";
    Rank["Queen"] = "Q";
    Rank["King"] = "K";
})(Rank || (Rank = {}));
export var PlayerStatus;
(function (PlayerStatus) {
    PlayerStatus[PlayerStatus["Active"] = 0] = "Active";
    PlayerStatus[PlayerStatus["OwesCard"] = 1] = "OwesCard";
    PlayerStatus[PlayerStatus["Dropped"] = 2] = "Dropped";
    PlayerStatus[PlayerStatus["Won"] = 3] = "Won";
    PlayerStatus[PlayerStatus["Lost"] = 4] = "Lost";
})(PlayerStatus || (PlayerStatus = {}));
export var MoveType;
(function (MoveType) {
    MoveType[MoveType["Drop"] = 0] = "Drop";
    MoveType[MoveType["TakeOpen"] = 1] = "TakeOpen";
    MoveType[MoveType["TakeFromDeck"] = 2] = "TakeFromDeck";
    MoveType[MoveType["ReturnExtraCard"] = 3] = "ReturnExtraCard";
    MoveType[MoveType["Meld"] = 4] = "Meld";
    MoveType[MoveType["Show"] = 5] = "Show";
    MoveType[MoveType["Finish"] = 6] = "Finish";
})(MoveType || (MoveType = {}));
export class Card {
    constructor(s, r) {
        this.suit = s;
        this.rank = r;
    }
    toJSON() {
        return this.suit + this.rank;
    }
    serialize() {
        return this.toJSON();
    }
}
export var GameState;
(function (GameState) {
    GameState[GameState["Active"] = 0] = "Active";
    GameState[GameState["Finished"] = 1] = "Finished";
})(GameState || (GameState = {}));
//-------------------------------=============================================
/**
 *
 * @param game
 * @returns a function that takes a card and determines if that card is a joker for this game
 */
const isJoker = (game) => (card) => card === game.currJoker || card.suit === Suit.Joker;
/**
 * Get sortable integer value for given Card Rank
 * @param rank
 * @returns integer
 */
const getRankOrdinal = (rank) => {
    return Object.values(Rank).indexOf(rank);
};
/**
 * Check if given generic array has duplicate elements
 * @param array
 * @returns
 */
function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}
/**
 * Get a random card
 * @returns 2 char string representing the card
 */
export function getRandomCard() {
    const suits = Array.from("CDHS");
    const ranks = Array.from("A23456789TJQK");
    const s = suits[Math.floor(Math.random() * suits.length)];
    const r = ranks[Math.floor(Math.random() * ranks.length)];
    return s + r;
}
/**
 * Make a Card from a two character string containing suit and rank
 * @param cardStr
 * @returns
 */
export function makeCard(cardStr) {
    assert(cardStr.length === 2);
    return new Card(cardStr[0], cardStr[1]);
}
export const deserializeCard = makeCard;
export const gamePlayersLens = R.lens((R.prop('players')), R.assoc('players'));
/**
 * Get the view of Game that the player is allowed to see
 * Player is not allowed to see the deck and other players' hands
 * @param game
 * @param playerIdx
 * @returns
 */
function getRestrictedView(game, playerIdx) {
    const restrictedPlayers = R.map(R.omit(["hand", "meld"]))(game.players);
    const limitedGame = R.set(gamePlayersLens, restrictedPlayers, game);
    const gameRestricted = R.omit(["deck"], limitedGame);
    gameRestricted["myHand"] = playerIdx >= 0 ? game.players[playerIdx].hand : undefined;
    gameRestricted["myMeld"] = playerIdx >= 0 ? game.players[playerIdx].meld : undefined;
    return gameRestricted;
}
/**
 * Make a Rummy sequence from cards in context of game (to know currentJoker)
 * @param game
 * @param cards
 * @returns ISequence or error if a valid sequence is not possible
 */
export function makeSequence(game, cards) {
    const numCards = cards.length;
    if (numCards < 3) {
        return Error("Too Few Cards");
    }
    const nonJokers = cards.filter(isJoker(game));
    const numJokers = numCards - nonJokers.length;
    if (!R.all((a) => a.suit === nonJokers[0].suit)(nonJokers)) {
        return Error("Sequence can't have different suits");
    }
    if (nonJokers.length === 0) {
        return { suit: Suit.Joker, ranks: [], numJokers: cards.length };
    }
    nonJokers.sort((a, b) => getRankOrdinal(a.rank) - getRankOrdinal(b.rank));
    const ranks = nonJokers.map((c) => c.rank);
    const ordinals = ranks.map(getRankOrdinal);
    //debug(`DBG ordinals = ${JSON.stringify(ordinals)}`);
    if (nonJokers[0].rank === Rank.Ace &&
        getRankOrdinal(nonJokers[1].rank) > numJokers + 1) {
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
/**
 * Make a Triplet from given cards in context of game
 * @param game
 * @param cards
 * @returns ITriplet or Error
 */
export function makeTriplet(game, cards) {
    const numCards = cards.length;
    if (numCards < 3 || numCards > 4) {
        return Error("Triplet must have 3 or 4 Cards");
    }
    const nonJokers = cards.filter(isJoker(game));
    const numJokers = numCards - nonJokers.length;
    if (nonJokers.length === 0) {
        return { rank: Rank.Two, suits: [], numJokers: cards.length };
    }
    nonJokers.sort((a, b) => getRankOrdinal(a.rank) - getRankOrdinal(b.rank));
    const suits = nonJokers.map((c) => c.suit);
    if (hasDuplicates(suits)) {
        return Error("Triplet must have different suits");
    }
    const ordinals = cards.map((c) => getRankOrdinal(c.rank));
    for (let i = 0; i < nonJokers.length - 1; i++) {
        //debug(`DBG ${ordinals[i + 1] - ordinals[i]} > ${usableJokers + 1}`);
        if (ordinals[i + 1] - ordinals[i] !== 0) {
            return Error("Triplet must have one rank");
        }
    }
    return { rank: nonJokers[0].rank, suits, numJokers };
}
/**
 * Make a Life - a sequence without jokers
 * @param game
 * @param cards
 * @returns
 */
export function makeLife(game, cards) {
    const seq = makeSequence(game, cards);
    if (seq instanceof Error)
        return seq;
    if (seq.numJokers > 0) {
        return Error(`Life sequence cannot have jokers`);
    }
    return R.omit(["numJokers"], seq);
}
/**
 * Make a Winning Hand from given sequences and triplets
 * @param sequences
 * @param triplets
 * @returns
 */
export function makeMeldedHand(sequences, triplets) {
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
/**
 * sum array of numbers
 */
const sum = R.reduce((tot, elem) => tot + elem, 0);
function cardsInSequence(seq) {
    return R.map((r) => new Card(seq.suit, r))(seq.ranks);
}
/**
 * Set difference
 * @param a
 * @param b
 * @returns
 */
function setDiff(a, b) {
    return new Set(Array.from(a).filter((item) => !b.has(item)));
}
/**
 * get cards from a ITriplet
 * @param trip
 * @returns
 */
function cardsInTriplet(trip) {
    return R.map((s) => new Card(s, trip.rank))(trip.suits);
}
/**
 * get all cards from a IMeldedHand
 * @param meldedHand
 * @returns
 */
export function enumerateMeldedHand(meldedHand) {
    var _a, _b, _c, _d;
    const jokers = R.repeat(new Card(Suit.Joker, Rank.One), sum(R.map(R.prop("numJokers"), (_a = meldedHand.triplets) !== null && _a !== void 0 ? _a : [])) +
        sum(R.map(R.prop("numJokers"), (_b = meldedHand.sequences) !== null && _b !== void 0 ? _b : [])));
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
/**
 * get Points for Card
 * @param c
 * @returns
 */
function pointsOfCard(c) {
    if ([Rank.Ace, Rank.King, Rank.Queen, Rank.Jack].includes(c.rank)) {
        return 10;
    }
    else {
        return getRankOrdinal(c.rank);
    }
}
/**
 * get total points for hand
 * @param game
 * @param playerIdx
 * @returns
 */
export function computePoints(game, playerIdx) {
    if (game.players[playerIdx].status === PlayerStatus.Won) {
        return 0;
    }
    const cardsToCount = setDiff(new Set(game.players[playerIdx].hand), new Set(enumerateMeldedHand(game.players[playerIdx].meld)));
    return Math.min(FULL_COUNT_POINTS, sum(R.map(pointsOfCard)(Array.from(cardsToCount))));
}
/**
 * Is winning hand made from these cards?
 * @param meldedHand
 * @param hand
 * @returns
 */
export function meldedHandMatchesHand(meldedHand, hand) {
    return new Set(hand) === new Set(enumerateMeldedHand(meldedHand));
}
/**
 * Make a Player
 * @param user
 * @returns
 */
export function newPlayer(user) {
    return { user, status: PlayerStatus.Active, points: 0, moved: false, hand: [], meld: {} };
}
/**
 * Make a new Rummy Game
 * @param playerIds
 * @param currUser
 * @returns
 */
export function makeGame(playerIds, currUser) {
    const numPlayers = playerIds.length;
    const minCards = numPlayers * 13 + 10;
    const nDecks = Math.ceil(minCards / 54);
    const decks = [];
    for (let i = 0; i < nDecks; i++) {
        decks.push(makeDeck());
    }
    const mergedDeck = mergeDecks(decks);
    const [usedDeck, hands, openCard, joker] = dealFromDeck(mergedDeck, numPlayers, 13);
    const players = R.map((u) => newPlayer(u), playerIds);
    const id = GAMES.length;
    const game = {
        id,
        state: GameState.Active,
        deck: usedDeck,
        hands,
        melds: [],
        openPile: [openCard],
        currJoker: joker,
        players,
        turnPlayer: players[0],
        moves: [],
    };
    GAMES.push(game);
    const userIdx = R.findIndex(R.propEq("user", currUser), game.players);
    return getRestrictedView(game, userIdx);
}
/**
 * Make an ordered Deck with 52 standard cards + 2 jokers
 * @returns Deck
 */
export function makeDeck() {
    const deck = [];
    for (const s of Object.values(Suit)) {
        if (s === Suit.Joker) {
            // Two Jokers
            deck.push(new Card(Suit.Joker, Rank.One));
            deck.push(new Card(Suit.Joker, Rank.One));
            continue;
        }
        for (const r of Object.values(Rank)) {
            if (r !== Rank.One) {
                const card = new Card(s, r);
                deck.push(card);
            }
        }
    }
    return deck;
}
/**
 * Shuffle a deck of (any number of) cards
 * @param deck
 * @returns shuffled deck
 */
export const shuffleDeck = (deck) => {
    return deck
        .map((value) => ({ value, randKey: Math.random() }))
        .sort((a, b) => a.randKey - b.randKey)
        .map(({ value }) => value);
};
/**
 * Combines given decks into one
 * @param decks
 * @returns
 */
export const mergeDecks = (decks) => {
    const d = [];
    return d.concat(...decks);
};
/**
 * Shuffle given and deal 13 cards to each player
 * @param deck
 * @param numPlayers
 * @param handSize
 * @returns
 */
export const dealFromDeck = (deck, numPlayers, handSize = 13) => {
    assert(deck.length > numPlayers * handSize + 2);
    const shuffled = shuffleDeck(deck);
    debug(`shuffled: ${JSON.stringify(shuffled)}`);
    const hands = [];
    for (let i = 0; i < numPlayers; i++) {
        hands.push(shuffled.splice(0, handSize));
    }
    const openCardArr = shuffled.splice(0, 1);
    const jokerArr = shuffled.splice(0, 1);
    return [shuffled, hands, openCardArr[0], jokerArr[0]];
};
/**
 * Is player status final?
 * @param p
 * @returns
 */
export function playerFinished(p) {
    return (p.status === PlayerStatus.Dropped ||
        p.status === PlayerStatus.Won ||
        p.status === PlayerStatus.Lost);
}
/**
 * Make a Rummy move. this is the only way for a Rummy game can change state
 * @param gameId
 * @param user
 * @param move
 * @returns
 */
export function makeMove(gameId, user, move) {
    const game = GAMES[gameId];
    if (!game) {
        return Error(`Invalid Game id ${gameId}`);
    }
    if (game.state === GameState.Finished) {
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
    if (player.status === PlayerStatus.OwesCard &&
        move.moveType !== MoveType.ReturnExtraCard) {
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
            }
            else {
                return Error("No card returned");
            }
            game.players[playerIdx].hand = game.players[playerIdx].hand.filter((c) => c !== move.cardDiscarded);
            player.status = PlayerStatus.Active;
            break;
        case MoveType.Meld:
            if (setDiff(new Set(enumerateMeldedHand(move.meldedHand)), new Set(game.players[playerIdx].hand)).size > 0) {
                return Error("Meld contains cards not in your Hand");
            }
            game.players[playerIdx].meld = move.meldedHand;
            break;
        case MoveType.Show:
            if (!meldedHandMatchesHand(move.meldedHand, game.players[playerIdx].hand)) {
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
