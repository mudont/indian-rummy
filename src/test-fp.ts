/* eslint-disable functional/no-expression-statement */
import * as E from "fp-ts/lib/Either";
import * as IO from "fp-ts/lib/IO";
import { pipe, flow } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { traceWithValue, trace } from "fp-ts-std/Debug";
import { Do } from "fp-ts-contrib/lib/Do";
import { log, error } from "fp-ts/lib/Console";
import * as R from 'ramda'
import { sequence } from "fp-ts/lib/Array"
import * as Rand from "fp-ts/lib/Random"
import * as L from "monocle-ts/Lens"
import * as assert from 'assert'
import * as O from 'monocle-ts/Optional'
import { some, none } from 'fp-ts/Option'
async function blog_eg() {
    const fa = () => TE.right(1);
    const fb = (a: E.Either<any, number>) => TE.right(11);
    const fc = (a: any) => TE.right(2);
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-unused-vars
    const fd = ({ a, b, c }: any) => TE.right(23);
    // https://dev.to/ryanleecode/practical-guide-to-fp-ts-p6-the-do-notation-noj
    const b = pipe(
        T.bindTo('a')(fa()),
        T.bind('b', ({ a }) => fb(a)),
        T.chainFirst(({ b }) => pipe(log(`log: ` + JSON.stringify(b)), T.fromIO)),
        T.bind('c', ({ a, b }) => fc({ a, b })),
        TE.fromTask,
        TE.bind('d', ({ a, b, c }) => fd({ a, b, c })),
        TE.map(({ d }) => d),
    )
    // eslint-disable-next-line functional/no-expression-statement
    console.log(await b())
    return 23;
}
function test_bind() {
    return pipe(
        // Can use either Do or bindTo as the first argument to pipe
        // Nothing special about Do here, only needed because fp-ts pipe is weird and
        // requires the first argument to be a value
        //E.Do,
        //E.bindTo('z')(E.right(1)),
        //-------
        E.of(2),
        E.bind('s', E.fromPredicate(R.lte(3), (n) => `Sequence must have at least 3 cards. got ${n}`)),
        E.bind('a', () => E.right(2)),
        E.bind('b', () => E.right(23)),
        E.bind('c', () => E.right(33)),
        E.bind('d', () => E.right(2)),
        E.bind('e', () => E.right(23)),
        E.bind('f', () => E.right(33)),
        // Amazing fact: if you repeaat one of the bind calls, you get a syntax error
        E.chain(E.fromPredicate(({ f }) => R.lte(30)(f), (n) => "bad value")),
        E.map((x) => { const a = log(x)(); return x }),
    );
}

function test_alt(ne: E.Either<string, number>) {
    // Alt takes over if the first argument is a Left
    return pipe(
        ne,
        E.alt(() => E.right(23)),
        E.map((x) => { const a = log(x)(); return x }),
    );
}

function sequence_rands(): number {
    const rands = sequence(IO.Applicative)([Rand.random, Rand.random, Rand.random,])
    // eslint-disable-next-line functional/no-expression-statement
    console.log(rands());
    return 23;
}


function testLens(): number {

    interface Street {
        readonly num: number
        readonly name: string
    }
    interface Address {
        readonly city: string
        readonly street: Street
    }
    interface Company {
        readonly name: string
        readonly address: Address
    }
    interface Employee {
        readonly name: string
        readonly company: Company
    }

    const employee: Employee = {
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
    }

    const capitalize = (s: string): string => s.substring(0, 1).toUpperCase() + s.substring(1)

    const employeeCapitalized = {
        ...employee,
        company: {
            ...employee.company,
            address: {
                ...employee.company.address,
                street: {
                    ...employee.company.address.street,
                    name: capitalize(employee.company.address.street.name)
                }
            }
        }
    }



    const capitalizeName = pipe(
        L.id<Employee>(),
        L.prop('company'),
        L.prop('address'),
        L.prop('street'),
        L.prop('name'),
        L.modify(capitalize)
    )

    assert.deepStrictEqual(capitalizeName(employee), employeeCapitalized)



    const firstLetterOptional: O.Optional<string, string> = {
        getOption: (s) => (s.length > 0 ? some(s[0]) : none),
        set: (a) => (s) => (s.length > 0 ? a + s.substring(1) : s)
    }

    const firstLetter = pipe(
        L.id<Employee>(),
        L.prop('company'),
        L.prop('address'),
        L.prop('street'),
        L.prop('name'),
        L.composeOptional(firstLetterOptional)
    )

    assert.deepStrictEqual(
        pipe(
            firstLetter,
            O.modify((s) => s.toUpperCase())
        )(employee),
        employeeCapitalized
    )
    return 0;
}
// eslint-disable-next-line functional/no-expression-statement
//console.log(test_alt(E.left("Bad")));
// eslint-disable-next-line functional/no-expression-statement
//void blog_eg()
// eslint-disable-next-line functional/no-expression-statement
testLens();
