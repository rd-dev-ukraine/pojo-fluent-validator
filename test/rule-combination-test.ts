import * as should from "should";

import { shouldPass, shouldFail } from "./utils";
import { rules } from "../src";
import { validateWithPromise as validate } from "./utils";

describe(".one combinator", () => {
    const rule = rules.one([
        rules.num().must(v => v === 300, { errorMessage: "== 300" }),
        rules.num().must(v => v < 100, { errorMessage: "< 100" }),
        rules.num().must(v => v % 2 === 0, { errorMessage: "% 2 === 0" }),
    ]);

    it("must pass if one rules passed", done => {
        const result = validate(2, rule);

        shouldPass(result, done,
            v => {
                v.should.equal(2);
            });
    });

    it("must fail if all rules failed", done => {
        const result = validate(201, rule);

        shouldFail(result, done, err => {
            err.should.deepEqual({
                [""]: ["== 300", "< 100", "% 2 === 0"]
            });
        });
    });

    it("must stop validating if all rules failed and stops on error is true", done => {
        const rule = rules.one([
            rules.num().must(v => v === 300, { errorMessage: "== 300" }),
            rules.num().must(v => v < 100, { errorMessage: "< 100" }).stopOnError(true),
            rules.num().must(v => v % 2 === 0, { errorMessage: "%2 === 0" }),
        ]);

        const result = validate(201, rule);

        shouldFail(result, done, err => {
            err.should.deepEqual({
                [""]: ["== 300", "< 100"]
            });
        });
    });

    it("must correct accumulate errors if several rules failed", done => {
        const rule = rules.one([
            rules.obj({
                id: rules.num().must(id => id > 0, { errorMessage: "> 0" })
            }).expandable(),
            rules.obj({
                id: rules.num().must(id => id % 2 === 0, { errorMessage: "% 2 === 0" })
            }).expandable(),
            rules.obj({
                title: rules.str().notEmpty({ errorMessage: "Title required" })
            }).expandable()
        ]);

        const r = validate({ id: -1 }, rule);

        shouldFail(r, done, err => {
            err.should.deepEqual({
                id: ["> 0", "% 2 === 0"],
                title: ["Title required"]
            });
        });

    });
});

// describe(".all combinator", () => {
//     const rule = rules.one([
//         rules.num().must(v => v > 10, { errorMessage: "> 10" }),
//         rules.num().must(v => v < 100, { errorMessage: "< 100" }),
//         rules.num().must(v => v % 2 === 0, { errorMessage: "%2 === 0" }),
//     ]);

//     it("must pass if all rules passed", done => {
//         const result = validate(20, rule);

//         shouldPass(result, done,
//             v => {
//                 v.should.equal(20);
//             });
//     });

//     it("must fail if one rule failed", done => {
//         const result = validate(200, rule);

//         shouldFail(result, done, err => {
//             err.should.deepEqual({
//                 [""]: ["< 100"]
//             });
//         });
//     });

//     it("must continue validating if one rule failed and stops on error is false", done => {
//         const result = validate(201, rule);

//         shouldFail(result, done, err => {
//             err.should.deepEqual({
//                 [""]: ["< 100", "%2 === 0"]
//             });
//         });
//     });

//     it("must stop validating if one rule failed and stops on error is true", done => {
//         const rule = rules.one([
//             rules.num().must(v => v > 10, { errorMessage: "> 10" }).stopOnError(true),
//             rules.num().must(v => v < 100, { errorMessage: "< 100" }).stopOnError(true),
//             rules.num().must(v => v % 2 === 0, { errorMessage: "%2 === 0" }).stopOnError(true),
//         ]);
//         const result = validate(201, rule);

//         shouldFail(result, done, err => {
//             err.should.deepEqual({
//                 [""]: ["< 100"]
//             });
//         });
//     });
// });