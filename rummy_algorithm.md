# Main Rummy algorithm

## Completed hand rules

- has 13 cards
- all 13 cards must be grouped into *sets* of 3 or more cards, at least two of which are *sequences*, and at least one of the sequences is a *life*
- A *set* is either a *sequence* or a "triqlet"
- A *sequence* is made of cards of consecutive ranks and same suit
- A *life* is a *sequence* without wild cards
- A *triqlet* is a *set* of 3 or 4 cards, all of the same rank, and distinct suits
- *joker* is a wildcard, and may be used as any other card to complete any set but a *life*
- One of the 52 cards maybe designated the joker. Such a card may be used as a wildcard or as itself
- there are also literal *jokers*, which can be used anywhere but in a *life*
- Rank: (in order) A,1,2,3,4,5,6,7,8,9,J,Q,K,A . Note that an Ace may be used as the lowest or the highest card when forming sequences
- Suit: A, C, D, H, J (literal joker)
- Card: <rank><suit>
- Deck: List<Card>
- Hand: List<Card>

## scoring a hand

- if there is no *life*, all cards except *jokers* must be added up. Value of a numbered card is its number. Other cards are worth 10 points.
- if there is a *life*, all sequences should be left out before scoring the hand
- if there is a *life* and at least one other *sequence*, all sets should be left out before scoring the hand.
- the score of a hand is the smallest possible score of all possibile ways of arranging sets
- a hand with a score of 0 is a winning hand

## Functions

- score(hand: Hand, designated_joker?: Card)
- is_complete_deck(deck: Deck)
= is_completed_hand(hand, designated_joker?) // same ase score(hand, dj) == 0