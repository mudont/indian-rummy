import { Solve, Solution, IModel } from "@mudont/js-milp-solver";
//import type { IModel, Solution } from "javascript-lp-solver"

//declare module 'javascript-lp-solver';
// import { IModel, Solution, Solve } from "../src/solver";
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