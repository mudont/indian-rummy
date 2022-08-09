"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable functional/no-expression-statement */
const monocle_ts_1 = require("monocle-ts");
const ReadonlyArray_1 = require("fp-ts/lib/ReadonlyArray");
const ReadonlyArray_2 = require("monocle-ts/lib/Index/ReadonlyArray");
const tweetsLens = monocle_ts_1.Lens.fromProp()('tweets');
const tweetTextLens = monocle_ts_1.Lens.fromProp()('text');
const tweetTraversal = (0, monocle_ts_1.fromTraversable)(ReadonlyArray_1.Traversable)();
// https://github.com/gcanti/monocle-ts/issues/77
// to select an array item by value of a property, use something like:
// const getTweetPrism = (id: number): Prism<Tweet, Tweet> => Prism.fromPredicate(child => child.id === id)
//
// To select an array item by index, use something like:
const ithTweet = (idx) => (0, ReadonlyArray_2.indexReadonlyArray)().index(idx);
const composedTraversal = tweetsLens.composeTraversal(tweetTraversal).composeLens(tweetTextLens);
const tweet1 = { text: 'hello world' };
const tweet2 = { text: 'foobar' };
const model = { tweets: [tweet1, tweet2] };
const newModel = composedTraversal.modify(text => 
// eslint-disable-next-line functional/immutable-data
text
    .split('')
    .reverse()
    .join(''))(model);
console.log(newModel);
console.log(tweetsLens.composeOptional(ithTweet(0)).composeLens(tweetTextLens).set("just foo")(model));
