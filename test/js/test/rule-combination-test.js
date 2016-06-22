"use strict";
var utils_1 = require("./utils");
var src_1 = require("../src");
var utils_2 = require("./utils");
describe(".one combinator", function () {
    var rule = src_1.rules.one([
        src_1.rules.num().must(function (v) { return v === 300; }, { errorMessage: "== 300" }),
        src_1.rules.num().must(function (v) { return v < 100; }, { errorMessage: "< 100" }),
        src_1.rules.num().must(function (v) { return v % 2 === 0; }, { errorMessage: "% 2 === 0" }),
    ]);
    it("must pass if one rules passed", function (done) {
        var result = utils_2.validateWithPromise(2, rule);
        utils_1.shouldPass(result, done, function (v) {
            v.should.equal(2);
        });
    });
    it("must fail if all rules failed", function (done) {
        var result = utils_2.validateWithPromise(201, rule);
        utils_1.shouldFail(result, done, function (err) {
            err.should.deepEqual((_a = {},
                _a[""] = ["== 300", "< 100", "% 2 === 0"],
                _a
            ));
            var _a;
        });
    });
    it("must stop validating if all rules failed and stops on error is true", function (done) {
        var rule = src_1.rules.one([
            src_1.rules.num().must(function (v) { return v === 300; }, { errorMessage: "== 300" }),
            src_1.rules.num().must(function (v) { return v < 100; }, { errorMessage: "< 100" }).stopOnError(true),
            src_1.rules.num().must(function (v) { return v % 2 === 0; }, { errorMessage: "%2 === 0" }),
        ]);
        var result = utils_2.validateWithPromise(201, rule);
        utils_1.shouldFail(result, done, function (err) {
            err.should.deepEqual((_a = {},
                _a[""] = ["== 300", "< 100"],
                _a
            ));
            var _a;
        });
    });
    it("must correct accumulate errors if several rules failed", function (done) {
        var rule = src_1.rules.one([
            src_1.rules.obj({
                id: src_1.rules.num().must(function (id) { return id > 0; }, { errorMessage: "> 0" })
            }).expandable(),
            src_1.rules.obj({
                id: src_1.rules.num().must(function (id) { return id % 2 === 0; }, { errorMessage: "% 2 === 0" })
            }).expandable(),
            src_1.rules.obj({
                title: src_1.rules.str().notEmpty({ errorMessage: "Title required" })
            }).expandable()
        ]);
        var r = utils_2.validateWithPromise({ id: -1 }, rule);
        utils_1.shouldFail(r, done, function (err) {
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
