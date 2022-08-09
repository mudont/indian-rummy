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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable functional/no-expression-statement */
const E = __importStar(require("fp-ts/lib/Either"));
const IO = __importStar(require("fp-ts/lib/IO"));
const function_1 = require("fp-ts/lib/function");
const T = __importStar(require("fp-ts/lib/Task"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const Console_1 = require("fp-ts/lib/Console");
const R = __importStar(require("ramda"));
const Array_1 = require("fp-ts/lib/Array");
const Rand = __importStar(require("fp-ts/lib/Random"));
const L = __importStar(require("monocle-ts/Lens"));
const assert = __importStar(require("assert"));
const O = __importStar(require("monocle-ts/Optional"));
const Option_1 = require("fp-ts/Option");
function blog_eg() {
    return __awaiter(this, void 0, void 0, function* () {
        const fa = () => TE.right(1);
        const fb = (a) => TE.right(11);
        const fc = (a) => TE.right(2);
        // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-unused-vars
        const fd = ({ a, b, c }) => TE.right(23);
        // https://dev.to/ryanleecode/practical-guide-to-fp-ts-p6-the-do-notation-noj
        const b = (0, function_1.pipe)(T.bindTo('a')(fa()), T.bind('b', ({ a }) => fb(a)), T.chainFirst(({ b }) => (0, function_1.pipe)((0, Console_1.log)(`log: ` + JSON.stringify(b)), T.fromIO)), T.bind('c', ({ a, b }) => fc({ a, b })), TE.fromTask, TE.bind('d', ({ a, b, c }) => fd({ a, b, c })), TE.map(({ d }) => d));
        // eslint-disable-next-line functional/no-expression-statement
        console.log(yield b());
        return 23;
    });
}
function test_bind() {
    return (0, function_1.pipe)(
    // Can use either Do or bindTo as the first argument to pipe
    // Nothing special about Do here, only needed because fp-ts pipe is weird and
    // requires the first argument to be a value
    //E.Do,
    //E.bindTo('z')(E.right(1)),
    //-------
    E.of(2), E.bind('s', E.fromPredicate(R.lte(3), (n) => `Sequence must have at least 3 cards. got ${n}`)), E.bind('a', () => E.right(2)), E.bind('b', () => E.right(23)), E.bind('c', () => E.right(33)), E.bind('d', () => E.right(2)), E.bind('e', () => E.right(23)), E.bind('f', () => E.right(33)), 
    // Amazing fact: if you repeaat one of the bind calls, you get a syntax error
    E.chain(E.fromPredicate(({ f }) => R.lte(30)(f), (n) => "bad value")), E.map((x) => { const a = (0, Console_1.log)(x)(); return x; }));
}
function test_alt(ne) {
    // Alt takes over if the first argument is a Left
    return (0, function_1.pipe)(ne, E.alt(() => E.right(23)), E.map((x) => { const a = (0, Console_1.log)(x)(); return x; }));
}
function sequence_rands() {
    const rands = (0, Array_1.sequence)(IO.Applicative)([Rand.random, Rand.random, Rand.random,]);
    // eslint-disable-next-line functional/no-expression-statement
    console.log(rands());
    return 23;
}
////////////////////////////////////////////////////////////////////////////////
// Monocle-ts  Lenses
////////////////////////////////////////////////////////////////////////////////
function testLens() {
    const employee = {
        name: 'john',
        company: {
            name: 'awesome inc',
            address: {
                city: 'london',
                street: {
                    num: 23,
                    name: 'high street'
                }
            }
        }
    };
    const capitalize = (s) => s.substring(0, 1).toUpperCase() + s.substring(1);
    const employeeCapitalized = Object.assign(Object.assign({}, employee), { company: Object.assign(Object.assign({}, employee.company), { address: Object.assign(Object.assign({}, employee.company.address), { street: Object.assign(Object.assign({}, employee.company.address.street), { name: capitalize(employee.company.address.street.name) }) }) }) });
    const capitalizeName = (0, function_1.pipe)(L.id(), L.prop('company'), L.prop('address'), L.prop('street'), L.prop('name'), L.modify(capitalize));
    assert.deepStrictEqual(capitalizeName(employee), employeeCapitalized);
    const firstLetterOptional = {
        getOption: (s) => (s.length > 0 ? (0, Option_1.some)(s[0]) : Option_1.none),
        set: (a) => (s) => (s.length > 0 ? a + s.substring(1) : s)
    };
    const firstLetter = (0, function_1.pipe)(L.id(), L.prop('company'), L.prop('address'), L.prop('street'), L.prop('name'), L.composeOptional(firstLetterOptional));
    assert.deepStrictEqual((0, function_1.pipe)(firstLetter, O.modify((s) => s.toUpperCase()))(employee), employeeCapitalized);
    return 0;
}
// eslint-disable-next-line functional/no-expression-statement
//console.log(test_alt(E.left("Bad")));
// eslint-disable-next-line functional/no-expression-statement
//void blog_eg()
// eslint-disable-next-line functional/no-expression-statement
testLens();
