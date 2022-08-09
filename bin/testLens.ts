/* eslint-disable functional/no-expression-statement */
import { Lens, Prism, fromTraversable } from 'monocle-ts'
import { Traversable } from 'fp-ts/lib/ReadonlyArray'
import { Traversable1 } from 'fp-ts/lib/Traversable'
import { indexReadonlyArray } from 'monocle-ts/lib/Index/ReadonlyArray'

interface Tweet {
    readonly text: string
}

interface TweetViewModel {
    // eslint-disable-next-line functional/prefer-readonly-type
    readonly tweets: readonly Tweet[]
}

const tweetsLens = Lens.fromProp<TweetViewModel>()('tweets')
const tweetTextLens = Lens.fromProp<Tweet>()('text')
const tweetTraversal = fromTraversable(Traversable)<Tweet>()
// https://github.com/gcanti/monocle-ts/issues/77
// to select an array item by value of a property, use something like:
// const getTweetPrism = (id: number): Prism<Tweet, Tweet> => Prism.fromPredicate(child => child.id === id)
//
// To select an array item by index, use something like:
const ithTweet = (idx: number) => indexReadonlyArray<Tweet>().index(idx)
const composedTraversal = tweetsLens.composeTraversal(tweetTraversal).composeLens(tweetTextLens)

const tweet1: Tweet = { text: 'hello world' }
const tweet2: Tweet = { text: 'foobar' }
const model: TweetViewModel = { tweets: [tweet1, tweet2] }

const newModel = composedTraversal.modify(text =>
    // eslint-disable-next-line functional/immutable-data
    text
        .split('')
        .reverse()
        .join('')
)(model)


console.log(newModel)

console.log(tweetsLens.composeOptional(ithTweet(0)).composeLens(tweetTextLens).set("just foo")(model))
