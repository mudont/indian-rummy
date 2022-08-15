"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_milp_solver_1 = require("@mudont/js-milp-solver");
/*
You run a small custom furniture shop and make custom tables and dressers.

Each week you're limited to 300 square feet of wood, 110 hours of labor, and 400 square feet of storage.

A table uses 30sf of wood, 5 hours of labor, requires 30sf of storage and has a gross profit of $1,200. A dresser uses 20sf of wood, 10 hours of work to put together, requires 50 square feet to store and has a gross profit of $1,600.

How much of each do you produce to maximize profit, given that partial furniture aren't allowed in this dumb world problem?
*/
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
