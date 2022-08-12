import { Solve, Solution, IModel } from "@mudont/js-milp-solver";


const rummyModel: IModel = {
    "optimize": "points",
    "opType": "max",
    "constraints": {

        "x0": { "min": 0, "max": 2 },
        "x1": { "min": 0, "max": 2, },
        "x2": { "min": 0, "max": 2, },
        "x3": { "min": 0, "max": 2, },
        "x4": { "min": 0, "max": 2, },
        "x5": { "min": 0, "max": 2, },
        "x6": { "min": 0, "max": 2, },
        "x7": { "min": 0, "max": 2, },
        "x8": { "min": 0, "max": 2, },

        //"y0": { "min": 0, "max": 1, },
        "y0": { "max": 1, },
        "y1": { "min": 0, "max": 1, },
        "y2": { "min": 0, "max": 0, },
        "y3": { "min": 0, "max": 0, },
        "y4": { "min": 0, "max": 0, },
        "y5": { "min": 0, "max": 0, },

        "CA_hms": { "equal": 2 },
        "C2_hms": { "equal": 0 },
        "C3_hms": { "equal": 0 },
        "DA_hms": { "equal": 0 },
        "D2_hms": { "equal": 0 },
        "D3_hms": { "equal": 0 },
    },
    "variables": {
        "x0": { "CA_hms": 1, "C2_hms": 1 },
        "x1": { "C2_hms": 1, "C3_hms": 1 },
        "x2": { "C3_hms": 1, "CA_hms": 1 },
        "x3": { "DA_hms": 1, "D2_hms": 1 },
        "x4": { "D2_hms": 1, "D3_hms": 1 },
        "x5": { "D3_hms": 1, "DA_hms": 1 },
        "x6": { "CA_hms": 1, "DA_hms": 1 },
        "x7": { "C2_hms": 1, "D2_hms": 1 },
        "x8": { "C3_hms": 1, "D3_hms": 1 },

        "y0": { "CA_hms": 1, "points": 10 },
        "y1": { "C2_hms": 1, "points": 2 },
        "y2": { "C3_hms": 1, "points": 3 },
        "y3": { "DA_hms": 1, "points": 10 },
        "y4": { "D2_hms": 1, "points": 2 },
        "y5": { "D3_hms": 1, "points": 3 },

    },
    "ints": {
        "x0": 1,
        "x1": 1,
        "x2": 1,
        "x3": 1,
        "x4": 1,
        "x5": 1,
        "x6": 1,
        "x7": 1,
        "x8": 1,
        "y0": 1,
        "y1": 1,
        "y2": 1,
        "y3": 1,
        "y4": 1,
        "y5": 1,
    }
};

// eslint-disable-next-line functional/no-expression-statement
//console.log(`rummyModel: ${JSON.stringify(rummyModel, null, 2)}`);

const resultsRummy: Solution<string> = Solve(rummyModel);
// eslint-disable-next-line functional/no-expression-statement
console.log(resultsRummy);
// eslint-disable-next-line functional/no-expression-statement
//console.log(`resultsRummy: ${JSON.stringify(resultsRummy)}`);