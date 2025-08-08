# Main Rummy algorithm

## Valid hand rules

- has 13 cards
- all 13 cards must be grouped into *sets* of 3 or more cards, at least two of which are *sequences*, and at least one of the sequences is a *life*
- A *set* is either a *sequence* or a "triqlet"
- A *sequence* is made of cards of consecutive ranks and same suit
- A *life* is a *sequence* without wild cards
- A *triqlet* is a *set* of 3 or 4 cards, all of the same rank, and distinct suits
- *joker* is a wildcard, and may be used as any other card to complete any set but a *life*
- One of the 52 cards maybe designated the joker. Such a card may be used as a wildcard or as itself
- there are also literal *jokers*, which can be used anywhere but in a *life*