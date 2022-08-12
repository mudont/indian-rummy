import { Solve, Solution, IModel } from "@mudont/js-milp-solver";

/*
PROBLEM:
========
On June 24, 1948, the former Soviet Union blocked all land and water routes through East Germany to Berlin. A gigantic airlift was organized using American and British planes to supply food, clothing and other supplies to more than 2 million people in West Berlin.

The cargo capacity was
- 30,000 cubic feet for an American plane and
- 20,000 cubic feet for a British plane.

To break the Soviet blockade, the Western Allies had to maximize cargo capacity, but were subject to the following restrictions:
- No more than 44 planes could be used.
- The larger American planes required 16 personnel per flight; double that of the requirement for the British planes. The total number of personnel available could not exceed 512.
- The cost of an American flight was $9000 and the cost of a British flight was $5000. The total weekly costs could note exceed $300,000.

Find the number of American and British planes that were used to maximize cargo capacity.
*/
const model: IModel = {
    "optimize": "capacity",
    "opType": "max",
    "constraints": {
        "plane": { "max": 44 },
        "person": { "max": 512 },
        "cost": { "max": 300000 }
    },
    "variables": {
        "brit": {
            "capacity": 20000,
            "plane": 1,
            "person": 8,
            "cost": 5000
        },
        "yank": {
            "capacity": 30000,
            "plane": 1,
            "person": 16,
            "cost": 9000
        }
    },
};

const results: Solution<string> = Solve(model);
// eslint-disable-next-line functional/no-expression-statement
console.log(results);