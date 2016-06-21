"use strict";
var should = require("should");
var utils_1 = require("./utils");
var src_1 = require("../src");
var utils_2 = require("./utils");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function () {
    describe("for numbers hash", function () {
        var numbersHash = src_1.rules.hash(src_1.rules.num().required().must(function (n) { return n > 0 && n < 10; }));
        it("must pass valid numbers", function (done) {
            var validHash = {
                one: 1,
                two: 2,
                three: 3,
                four: 4
            };
            utils_2.validateWithPromise(validHash, numbersHash)
                .then(function (v) { return utils_1.assertBlock(done, function () {
                should(v).deepEqual(validHash);
            }); })
                .catch(function (err) {
                done("Must pass");
            });
        });
        it("must fail on invalid numbers", function (done) {
            var invalidHash = {
                one: 1,
                two: 2,
                three: "three"
            };
            utils_2.validateWithPromise(invalidHash, numbersHash)
                .then(function () { return done("Must fail"); })
                .catch(function (err) { return utils_1.assertBlock(done, function () {
                err.should.deepEqual({
                    "three": ["Value is not a valid number."]
                });
            }); });
        });
        it("must not fail and skip invalid if configured", function (done) {
            var numbersHashWithSkip = src_1.rules.hash(src_1.rules.num().required().must(function (n) { return n > 0 && n < 10; })).skipInvalidElements();
            var invalidHash = {
                one: 1,
                two: 2,
                three: "three"
            };
            utils_2.validateWithPromise(invalidHash, numbersHashWithSkip)
                .then(function (r) { return utils_1.assertBlock(done, function () {
                r.should.deepEqual({
                    one: 1,
                    two: 2
                });
            }); })
                .catch(function () { return done("Must pass!"); });
        });
    });
    describe("for objects hash", function () {
        var objectHash = src_1.rules.hash(src_1.rules.obj({
            id: src_1.rules.num().required(),
            title: src_1.rules.str().required()
        }));
        it("must not fail on null value if required is not specified", function (done) {
            utils_2.validateWithPromise(null, objectHash)
                .then(function (v) { return utils_1.assertBlock(done, function () {
                should(v).be.null();
            }); })
                .catch(function (err) { return done("Must pass but failed with error" + JSON.stringify(err)); });
        });
        it("must fail on null value if required is specified", function (done) {
            var objHashRequiredRule = objectHash.required({ errorMessage: "NULL!!" });
            utils_2.validateWithPromise(null, objHashRequiredRule)
                .then(function (v) { return done("Must fail but passed with value " + JSON.stringify(v)); })
                .catch(function (err) { return utils_1.assertBlock(done, function () {
                err.should.deepEqual({
                    "": ["NULL!!"]
                });
            }); });
        });
        it("must pass on valid hash", function (done) {
            var validHash = {
                "1": {
                    id: 1,
                    title: "one"
                },
                "2": {
                    id: 2,
                    title: "two"
                }
            };
            utils_2.validateWithPromise(validHash, objectHash)
                .then(function (r) { return utils_1.assertBlock(done, function () {
                r.should.deepEqual(validHash);
            }); })
                .catch(function () { return done("Must pass"); });
        });
        it("must fail on element error", function (done) {
            var invalidHash = {
                "one": {
                    id: 1,
                    title: "one"
                },
                "two": {
                    id: "two",
                    title: "two"
                }
            };
            utils_2.validateWithPromise(invalidHash, objectHash)
                .then(function () { return done("Must fail"); })
                .catch(function (err) { return utils_1.assertBlock(done, function () {
                err.should.deepEqual({
                    "two.id": ["Value is not a valid number."]
                });
            }); });
        });
        it("must skip invalid elements on inner element error", function (done) {
            var objectHashWithSkip = objectHash.skipInvalidElements();
            var invalidHash = {
                "one": {
                    id: 1,
                    title: "one"
                },
                "two": {
                    id: "two",
                    title: "two"
                }
            };
            utils_2.validateWithPromise(invalidHash, objectHashWithSkip)
                .then(function (v) { return utils_1.assertBlock(done, function () {
                v.should.deepEqual({
                    "one": {
                        id: 1,
                        title: "one"
                    }
                });
            }); })
                .catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
        });
    });
    describe("for hash validator with filtering", function () {
        var elementRule = src_1.rules.obj({
            id: src_1.rules.num().required().must(function (v) { return v > 10; }, { errorMessage: "Too small" }),
            title: src_1.rules.str().required()
        });
        var hashRule = src_1.rules.hash(elementRule).filter(function (key) { return key.indexOf("i_") !== 0; });
        it("must filter out elements", function (done) {
            utils_2.validateWithPromise({
                "one": {
                    id: 20,
                    title: "twenty"
                },
                "i_one": {
                    id: 1,
                    title: "one"
                }
            }, hashRule)
                .then(function (v) { return utils_1.assertBlock(done, function () {
                v.should.deepEqual({
                    "one": {
                        id: 20,
                        title: "twenty"
                    }
                });
            }); })
                .catch(function () { return done("Must pass"); });
        });
        it("must fail on non-filtered elements", function (done) {
            utils_2.validateWithPromise({
                "one": {
                    id: 2,
                    title: "twenty"
                },
                "i_one": {
                    id: 1,
                    title: "one"
                }
            }, hashRule)
                .then(function () { return done("Must fail"); })
                .catch(function (err) { return utils_1.assertBlock(done, function () {
                err.should.deepEqual({
                    "one.id": ["Too small"]
                });
            }); });
        });
        it("must run before rule on filtered hash", function (done) {
            var hashRuleWithBefore = hashRule.before(function (h) { return !h["i_one"]; }, { errorMessage: "i_one is not filtered out" });
            utils_2.validateWithPromise({
                "first": {
                    id: 20,
                    title: "twenty"
                },
                "i_one": {
                    id: 1,
                    title: "one"
                }
            }, hashRuleWithBefore).then(function (r) { return utils_1.assertBlock(done, function () {
                r.should.deepEqual({
                    "first": {
                        id: 20,
                        title: "twenty"
                    }
                });
            }); }).catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
        });
        it("must run after rule on hash with skipped invalid elements", function (done) {
            var hashRuleWithAfter = hashRule.stopOnFail(false)
                .skipInvalidElements()
                .after(function (h) { return !h["second"]; }, { errorMessage: "second is not skipped as error" });
            utils_2.validateWithPromise({
                "first": {
                    id: 20,
                    title: "twenty"
                },
                "second": {
                    id: 1,
                    title: "one"
                }
            }, hashRuleWithAfter).then(function (r) { return utils_1.assertBlock(done, function () {
                r.should.deepEqual({
                    "first": {
                        id: 20,
                        title: "twenty"
                    }
                });
            }); }).catch(function (err) { return done("Must pass but failed with error " + JSON.stringify(err)); });
        });
    });
};
