"use strict";
var should = require("should");
var utils_1 = require("./utils");
var src_1 = require("../src");
var utils_2 = require("./utils");
describe("for number array", function () {
    var numberArrayValidator = src_1.rules.arr(src_1.rules.num().required().must(function (v) { return v > 0 && v < 10; }));
    it("must not fail on null value if required is not specified", function (done) {
        utils_2.validateWithPromise(null, numberArrayValidator)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            should(v).be.null();
        }); })
            .catch(function (err) { return done("Must pass but failed with error" + JSON.stringify(err)); });
    });
    it("must fail on null value if required is specified", function (done) {
        var arrayRequiredRule = numberArrayValidator.required({ errorMessage: "NULL!!" });
        utils_2.validateWithPromise(null, arrayRequiredRule)
            .then(function (v) { return done("Must fail but passed with value " + JSON.stringify(v)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "": ["NULL!!"]
            });
        }); });
    });
    it("should pass for valid array", function (done) {
        var validArray = [1, 2, 4];
        utils_2.validateWithPromise(validArray, numberArrayValidator)
            .then(function (r) { return utils_1.assertBlock(done, function () {
            should(r).deepEqual([1, 2, 4]);
        }); })
            .catch(function (err) { return done("Must not fail but failed with error " + JSON.stringify(err)); });
    });
    it("should fail for invalid array", function (done) {
        var invalidArray = [1, 2, "sad"];
        utils_2.validateWithPromise(invalidArray, numberArrayValidator)
            .then(function (r) { return done("Must fail but passed with result " + JSON.stringify(r)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "[2]": ["Value is not a valid number."]
            });
        }); });
    });
    it("should support filtering", function (done) {
        var numberArrayValidatorWithFilter = src_1.rules.arr(src_1.rules.num().required().must(function (v) { return v > 0 && v < 10; })).filter(function (v) { return v < 10; });
        var numbers = [1, 2, 10, 20];
        utils_2.validateWithPromise(numbers, numberArrayValidatorWithFilter)
            .then(function (r) { return utils_1.assertBlock(done, function () {
            r.should.deepEqual([1, 2]);
        }); })
            .catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
    });
    it("should use target indexes in error path when fail after filtering", function (done) {
        var numberArrayValidatorWithFilter = src_1.rules.arr(src_1.rules.num().required().must(function (v) { return v > 0 && v < 10; }, { errorMessage: "Too large" })).filter(function (v) { return v < 50; });
        var numbers = [1, 2, 100, 200, 4, 300, 20];
        utils_2.validateWithPromise(numbers, numberArrayValidatorWithFilter)
            .then(function (r) { return done("Must fail but passed with result " + JSON.stringify(r)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "[6]": ["Too large"]
            });
        }); });
    });
    it("should run before rules on non-filtered array", function (done) {
        var rule = src_1.rules.arr(src_1.rules.num().required()).before(function (arr) { return arr[1] === 20; }, { errorMessage: "Element was filtered out" })
            .filter(function (e) { return e < 10; });
        utils_2.validateWithPromise([1, 20, 3], rule)
            .then(function (r) { return utils_1.assertBlock(done, function () {
            r.should.deepEqual([1, 3]);
        }); })
            .catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
    });
    it("should run after rules on filtered array", function (done) {
        var rule = src_1.rules.arr(src_1.rules.num().required()).after(function (arr) { return arr[1] === 3; }, { errorMessage: "Element was not filtered out" })
            .filter(function (e) { return e < 10; });
        utils_2.validateWithPromise([1, 20, 3], rule)
            .then(function (r) { return utils_1.assertBlock(done, function () {
            r.should.deepEqual([1, 3]);
        }); })
            .catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
    });
    it("should run after rules on array with skipped invalid elements", function (done) {
        var rule = src_1.rules.arr(src_1.rules.num().required().must(function (v) { return v < 10; }, { errorMessage: "Too large" })).after(function (arr) { return arr[1] === 3; }, { errorMessage: "Element was not filtered out" }).skipInvalidElements();
        utils_2.validateWithPromise([1, 20, 3], rule)
            .then(function (r) { return utils_1.assertBlock(done, function () {
            r.should.deepEqual([1, 3]);
        }); })
            .catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
    });
    it("should not fail on null value if required is not specified", function (done) {
        var rule = src_1.rules.arr(src_1.rules.num().required());
        utils_2.validateWithPromise(null, rule)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            should(v).be.null();
        }); })
            .catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
    });
});
describe("for object array", function () {
    it("should correctly build path on failed element validator", function (done) {
        var rule = src_1.rules.arr(src_1.rules.obj({
            id: src_1.rules.num().required().must(function (v) { return v < 10; }, { errorMessage: "Too large" }),
            title: src_1.rules.str()
        }));
        utils_2.validateWithPromise([
            {
                id: 1,
                title: "one"
            },
            {
                id: 10,
                title: "ten"
            }
        ], rule)
            .then(function (r) { return done("Must fail but passed with result " + JSON.stringify(r)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "[1].id": ["Too large"]
            });
        }); });
    });
    it("should build correct indexes for nested arrays", function (done) {
        var rule = src_1.rules.arr(src_1.rules.arr(src_1.rules.num().must(function (n) { return n < 10; }, { errorMessage: "Too large" })));
        utils_2.validateWithPromise([
            [0, 1, 2],
            [0, 20],
            [22, 3, 10]
        ], rule).then(function (r) { return done("Must fail but passed with result " + JSON.stringify(r)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "[1][1]": ["Too large"],
                "[2][0]": ["Too large"],
                "[2][2]": ["Too large"]
            });
        }); });
    });
    it("should build correct indexes for arrays nested in obj", function (done) {
        var rule = src_1.rules.arr(src_1.rules.arr(src_1.rules.num().must(function (n) { return n < 10; }, { errorMessage: "Too large" })));
        utils_2.validateWithPromise([
            [0, 1, 2],
            [0, 20],
            [22, 3, 10]
        ], rule).then(function (r) { return done("Must fail but passed with result " + JSON.stringify(r)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "[1][1]": ["Too large"],
                "[2][0]": ["Too large"],
                "[2][2]": ["Too large"]
            });
        }); });
    });
    describe("should build correct path for nested structure", function () {
        var rule = src_1.rules.arr(src_1.rules.obj({
            id: src_1.rules.num().required({ errorMessage: "ID is required" }),
            data: src_1.rules.arr(src_1.rules.str().notEmpty({ errorMessage: "Data item is required" })).required({ errorMessage: "Data is required" })
                .after(function (arr) { return arr.length < 3; }, { errorMessage: "Too many data" })
        }));
        it("if error in most nest level", function (done) {
            utils_2.validateWithPromise([
                {
                    id: 0,
                    data: ["1", "2"]
                },
                {
                    id: 1
                },
                {
                    id: 2,
                    data: ["3", null]
                },
                {
                    data: ["1", "2", "4", "3"]
                }], rule)
                .then(function (r) { return done("Must fail but passed with result " + JSON.stringify(r)); })
                .catch(function (err) { return utils_1.assertBlock(done, function () {
                err.should.deepEqual({
                    "[1].data": ["Data is required"],
                    "[2].data[1]": ["Data item is required"],
                    "[3].id": ["ID is required"],
                    "[3].data": ["Too many data"]
                });
            }); });
        });
    });
});
