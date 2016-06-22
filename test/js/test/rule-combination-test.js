"use strict";
var utils_1 = require("./utils");
var src_1 = require("../src");
var utils_2 = require("./utils");
describe(".one combinator", function () {
    var rule = src_1.rules.one([
        src_1.rules.num().must(function (v) { return v > 10; }, { errorMessage: "> 10" }),
        src_1.rules.num().must(function (v) { return v < 100; }, { errorMessage: "< 100" }),
        src_1.rules.num().must(function (v) { return v % 2 === 0; }, { errorMessage: "%2 === 0" }),
    ], { errorMessage: "Failed!" });
    it("must pass if all rules passed", function (done) {
        var result = utils_2.validateWithPromise(20, rule);
        utils_1.shouldPass(result, done, function (v) {
            v.should.equal(20);
        });
    });
    it("must fail if one rule failed", function (done) {
        var result = utils_2.validateWithPromise(200, rule);
        utils_1.shouldFail(result, done, function (err) {
            err.should.deepEqual((_a = {},
                _a[""] = ["< 100"],
                _a
            ));
            var _a;
        });
    });
});
