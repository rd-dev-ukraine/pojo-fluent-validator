"use strict";
var should = require("should");
var utils_1 = require("./utils");
var src_1 = require("../src");
var utils_2 = require("./utils");
describe("for string", function () {
    it("should validate if value is string", function (done) {
        utils_2.validateWithPromise("213", src_1.rules.str())
            .then(function (value) { return utils_1.assertBlock(done, function () {
            should(value).be.equal("213");
        }); })
            .catch(function (err) { return done(err); });
    });
    it("should error if value is not string and conversion disabled", function (done) {
        utils_2.validateWithPromise(213, src_1.rules.str(false, { errorMessage: "Value is not string" }))
            .then(function (v) {
            done("Validation must fail");
        })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""][0]).be.equal("Value is not string");
        }); });
    });
    it("should be ok if value is not string and conversion enabled", function (done) {
        utils_2.validateWithPromise(213, src_1.rules.str())
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.be.equal("213");
        }); })
            .catch(function (err) {
            done("Validation must not fail.");
        });
    });
    it("should run chained validators", function (done) {
        utils_2.validateWithPromise("", src_1.rules.str().notEmpty({ errorMessage: "Empty string is invalid!" }))
            .then(function () {
            done("Validation must faild.");
        })
            .catch(function (errors) { return utils_1.assertBlock(done, function () {
            errors[""][0].should.be.equal("Empty string is invalid!");
        }); });
    });
    it("should pass if null string and no required rule", function (done) {
        utils_2.validateWithPromise(null, src_1.rules.str(false))
            .then(function (v) { return utils_1.assertBlock(done, function () {
            should(v).be.null();
        }); })
            .catch(function (err) {
            done("Validation should not fail.");
        });
    });
    it("should fail if null string and required rule included", function (done) {
        utils_2.validateWithPromise(null, src_1.rules.str(false).required({ errorMessage: "NULL!!" }))
            .then(function () { return done("Validation must fail."); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["NULL!!"]);
        }); });
    });
    it("should pass if null string and required rule included and conversion enabled", function (done) {
        utils_2.validateWithPromise(null, src_1.rules.str().required({ errorMessage: "NULL!!" }))
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.equal("");
        }); })
            .catch(function (err) { return done("Validation must pass but failed with error " + JSON.stringify(err)); });
    });
    it("should fail if notEmpty rule added for empty string", function (done) {
        utils_2.validateWithPromise("", src_1.rules.str()
            .required({ errorMessage: "Required fail" })
            .notEmpty({ errorMessage: "Not empty fail" }))
            .then(function (v) { return done("Validation must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err[""].should.deepEqual(["Not empty fail"]);
        }); });
    });
    it("should fail is must condition is failed", function (done) {
        utils_2.validateWithPromise("123", src_1.rules.str()
            .required()
            .must(function (v) { return v.length > 10; }, { errorMessage: "Too short!" }))
            .then(function () { return done("Must fail!"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["Too short!"]);
        }); });
    });
    it("should pass is must condition is met", function (done) {
        utils_2.validateWithPromise("1234567890", src_1.rules.str()
            .required()
            .must(function (v) { return v.length > 3; }, { errorMessage: "Too short!" }))
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.equal("1234567890");
        }); })
            .catch(function () { return done("Must pass!!"); });
    });
});
describe("for number", function () {
    it("should pass on valid number", function (done) {
        var numValue = 233.4;
        utils_2.validateWithPromise(numValue, src_1.rules.num().must(function (v) { return v > 200 && v < 300; }))
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.equal(numValue);
        }); })
            .catch(function (err) { return done("Validation must pass!"); });
    });
    it("should convert number if value is convertible", function (done) {
        var convertibleValue = "2344.4";
        utils_2.validateWithPromise(convertibleValue, src_1.rules.num())
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.equal(2344.4);
        }); })
            .catch(function () { return done("Validation must pass and convert a number"); });
    });
    it("should fail number if value is not convertible", function (done) {
        var convertibleValue = "sdffsdf";
        utils_2.validateWithPromise(convertibleValue, src_1.rules.num(true, { errorMessage: "NOT CONVERTIBLE" }))
            .then(function (v) { return done(v); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["NOT CONVERTIBLE"]);
        }); });
    });
    it("should fail if value is convertible but conversion disabled", function (done) {
        var convertibleValue = "2344.4";
        utils_2.validateWithPromise(convertibleValue, src_1.rules.num(false, { errorMessage: "NOT NUMBER!" }))
            .then(function (v) { return done("Must not convert if conversion disabled!"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["NOT NUMBER!"]);
        }); });
    });
    it("should pass without conversion if null value and no required rule", function (done) {
        utils_2.validateWithPromise(null, src_1.rules.num(false))
            .then(function (v) { return utils_1.assertBlock(done, function () {
            should(v).be.null();
        }); })
            .catch(function () { return done("Validation must pass!"); });
    });
    it("should pass with conversion if null value and no required rule", function (done) {
        utils_2.validateWithPromise(null, src_1.rules.num())
            .then(function (v) { return utils_1.assertBlock(done, function () {
            should(v).be.null();
        }); })
            .catch(function () { return done("Validation must pass!"); });
    });
    it("should fail if null value and required rule included", function (done) {
        utils_2.validateWithPromise(null, src_1.rules.num(false).required({ errorMessage: "REQUIRED" }))
            .then(function () { return done("Validation must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["REQUIRED"]);
        }); });
    });
    it("should fail if conversion disabled and value is not a number", function (done) {
        utils_2.validateWithPromise("1223", src_1.rules.num(false, { errorMessage: "NOT A NUMBER" }))
            .then(function () { return done("Validation must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["NOT A NUMBER"]);
        }); });
    });
});
describe("for any value", function () {
    var validator = src_1.rules.any(function (v) { return new Date("" + v) !== undefined; }, { errorMessage: "Invalid date" })
        .parse(function (v) { return new Date("" + v); });
    it("must validate correct date", function (done) {
        utils_2.validateWithPromise("2014-11-01", validator)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.getTime().should.equal(new Date("2014-11-01").getTime());
        }); })
            .catch(function () { return done("Must pass!!"); });
    });
    it("must validate correct if first parameter of any is not specified", function (done) {
        var rule = src_1.rules.any().parseAndValidate(function (v) { return !v ? v : new Date(v); }, function (done, parsed) {
            if (isNaN(parsed)) {
                done("Value is not a valid date");
            }
            else {
                done();
            }
        });
        utils_1.shouldPass(utils_2.validateWithPromise("2011-01-01", rule), done, function (r) {
            r.getTime().should.equal(new Date("2011-01-01").getTime());
        });
    });
    it("must validate correct if first parameter of any is not specified for invalid value", function (done) {
        var rule = src_1.rules.any().parseAndValidate(function (v) { return !v ? v : new Date(v); }, function (done, parsed) {
            if (isNaN(parsed)) {
                done("Value is not a valid date");
            }
            else {
                done();
            }
        });
        utils_1.shouldFail(utils_2.validateWithPromise("sdfsdf01", rule), done, function (err) {
            err.should.deepEqual((_a = {},
                _a[""] = ["Value is not a valid date"],
                _a
            ));
            var _a;
        });
    });
});
