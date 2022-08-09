"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_milp_solver_1 = require("@mudont/js-milp-solver");
//import type { IModel, Solution } from "javascript-lp-solver"
//declare module 'javascript-lp-solver';
// import { IModel, Solution, Solve } from "../src/solver";
const model = {
    "optimize": "profit",
    "opType": "max",
    "constraints": {
        "wood": { "max": 300 },
        "labor": { "max": 110 },
        "storage": { "max": 400 }
    },
    "variables": {
        "table": { "wood": 30, "labor": 5, "profit": 1200, "table": 1, "storage": 30 },
        "dresser": { "wood": 20, "labor": 10, "profit": 1600, "dresser": 1, "storage": 50 }
    },
    "ints": { "table": 1, "dresser": 1 }
};
const results = (0, js_milp_solver_1.Solve)(model);
// eslint-disable-next-line functional/no-expression-statement
console.log(results);
