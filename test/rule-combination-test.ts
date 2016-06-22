import * as should from "should";

import { shouldPass, shouldFail } from "./utils";
import { rules } from "../src";
import { validateWithPromise as validate } from "./utils";

describe(".one combinator", () => {
    const rule = rules.one([
        rules.num().must(v => v > 10, { errorMessage: "> 10" }),
        rules.num().must(v => v < 100, { errorMessage: "< 100" }),
        rules.num().must(v => v % 2 === 0, { errorMessage: "%2 === 0" }),
    ], { errorMessage: "Failed!" });

    it("must pass if all rules passed", done => {
        const result = validate(20, rule);

        shouldPass(result, done,
            v => {
                v.should.equal(20);
            });
    });

    it("must fail if one rule failed", done => {
        const result = validate(200, rule);

        shouldFail(result, done, err => {
            err.should.deepEqual({
                [""]: ["< 100"]
            });
        });
        
    });
});