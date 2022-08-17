/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
import * as C from "../card";
import { Rank, Suit } from "../types";

test("Random card", () => {
    const c = C.getRandomCard()()
    expect(c.length).toBe(2);
});

test("Get suit cards", () => {
    const c = C.getSuitCards(Suit.Hearts)
    expect(c.length).toBe(13);
    const j = C.getSuitCards(Suit.Joker)
    expect(j.length).toBe(2);
});
test("Shuffle deck", () => {
    const d0 = C.mkDeck(0)
    const d = C.shuffleDeck(d0)()
    expect(d.length).toBe(52);
});
test("merge decks", () => {
    const d0 = C.mkDeck(1)
    const d1 = C.mkDeck(2)
    const d = C.mergeDecks([d0, d1])
    expect(d.length).toBe(107);
});

test("isJOker", () => {
    expect(C.isJoker(C.mkCard(Suit.Diamonds, Rank.King))(C.mkCard(Suit.Joker, Rank.Joker))).toBe(true);
    expect(C.isJoker(C.mkCard(Suit.Diamonds, Rank.King))(C.mkCard(Suit.Diamonds, Rank.King))).toBe(true);
    expect(C.isJoker(C.mkCard(Suit.Diamonds, Rank.King))(C.mkCard(Suit.Hearts, Rank.King))).toBe(false);
});
test("getRankOrdinal", () => {
    expect(C.getRankOrdinal(Rank.Ace)).toBe(1);
});