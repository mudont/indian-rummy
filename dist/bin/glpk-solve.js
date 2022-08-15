"use strict";
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */
Object.defineProperty(exports, "__esModule", { value: true });
//import * as G from 'glpk-ts';
const glpk_ts_1 = require("glpk-ts");
void (0, glpk_ts_1.loadModule)().then(() => {
    const m = new glpk_ts_1.Model();
    // create 2 non-negative variables
    const [x, y] = m.addVars(2, { lb: 0.0, obj: -1.0 });
    // add the constraint x + y <= 1
    m.addConstr({
        ub: 1.0,
        coeffs: [
            [x, 1.0],
            [y, 1.0],
        ],
    });
    // let the simplex method solve the problem
    m.simplex();
    console.log(`x = ${x.value}, y = ${y.value}`);
});
