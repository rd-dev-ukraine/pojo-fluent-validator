"use strict";
var should = require("should");
var utils_1 = require("./utils");
var src_1 = require("../src");
var utils_2 = require("./utils");
describe("for object with flat structure", function () {
    var objectStructure = src_1.rules.obj({
        id: src_1.rules.str().required().notEmpty({ errorMessage: "Empty!!" }),
        title: src_1.rules.str().notEmpty().must(function (v) { return v.length > 3; }, { errorMessage: "Too short" }),
        description: src_1.rules.str(),
        price: src_1.rules.num().required().must(function (p) { return p > 0; }, { errorMessage: "Positive!!!" })
    });
    it("must not fail on null value if required is not specified", function (done) {
        utils_2.validateWithPromise(null, objectStructure)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            should(v).be.null();
        }); })
            .catch(function (err) { return done("Must pass but failed with error" + JSON.stringify(err)); });
    });
    it("must fail on null value if required is specified", function (done) {
        var objRequiredRule = objectStructure.required({ errorMessage: "NULL!!" });
        utils_2.validateWithPromise(null, objRequiredRule)
            .then(function (v) { return done("Must fail but passed with value " + JSON.stringify(v)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "": ["NULL!!"]
            });
        }); });
    });
    it("should pass validation for correct structure", function (done) {
        var test = {
            id: "2342340",
            title: "test",
            price: 23
        };
        utils_2.validateWithPromise(test, objectStructure)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.deepEqual({
                id: "2342340",
                title: "test",
                price: 23,
                description: ""
            });
        }); })
            .catch(function () { return done("Must fail"); });
    });
    it("should not put extra properties in result", function (done) {
        var test = {
            id: "2342340",
            title: "test",
            price: 23,
            delivery: 233
        };
        utils_2.validateWithPromise(test, objectStructure)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.deepEqual({
                description: "",
                id: "2342340",
                title: "test",
                price: 23
            });
        }); })
            .catch(function () { return done("Must pass!"); });
    });
    it("should fail for invalid property values", function (done) {
        var test = {
            id: "",
            title: "test",
            price: -23
        };
        utils_2.validateWithPromise(test, objectStructure)
            .then(function () { return done("Must fail!"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.id.should.deepEqual(["Empty!!"]);
            err.price.should.deepEqual(["Positive!!!"]);
        }); });
    });
    it("should fail on few property errors", function (done) {
        var rule = src_1.rules.obj({
            id: src_1.rules.num().must(function (v) { return v > 100; }, { errorMessage: "Too small" }),
            price: src_1.rules.num().must(function (p) { return p > 0; }, { errorMessage: "Price must be positive" })
        });
        utils_2.validateWithPromise({ id: 1, price: -15 }, rule)
            .then(function (v) { return done("Must fail but success with value " + JSON.stringify(v)); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                id: ["Too small"],
                price: ["Price must be positive"]
            });
        }); });
    });
});
describe("for any object", function () {
    it("should support .after() validation rule", function (done) {
        var struct = src_1.rules.obj({
            id: src_1.rules.num().required(),
            price: src_1.rules.num().required(),
            retailPrice: src_1.rules.num().required()
        }).after(function (v) { return v["price"] < v["retailPrice"]; }, { errorMessage: "Price is not profitable" });
        var result = utils_2.validateWithPromise({
            id: 10,
            price: 100,
            retailPrice: 50
        }, struct)
            .then(function () { return done("Must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err[""]).deepEqual(["Price is not profitable"]);
        }); });
    });
});
describe("for any object", function () {
    it("should support .before() validation rule", function (done) {
        var struct = src_1.rules.obj({
            id: src_1.rules.num().required().must(function (v) { return v > 100; }, { errorMessage: "ID must be greater than 100" }),
            price: src_1.rules.num().required(),
            retailPrice: src_1.rules.num().required()
        }).before(function (v) { return v["price"] < v["retailPrice"]; }, { errorMessage: "Price is not profitable", stopOnFailure: true });
        var result = utils_2.validateWithPromise({
            id: 10,
            price: 100,
            retailPrice: 50
        }, struct)
            .then(function () { return done("Must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            should(err).deepEqual({
                "": ["Price is not profitable"]
            });
        }); });
    });
});
describe("for secondary level nested object", function () {
    var v = src_1.rules.obj({
        id: src_1.rules.num().required(),
        delivery: src_1.rules.obj({
            price: src_1.rules.num(),
            address: src_1.rules.obj({
                code: src_1.rules.num().required({ errorMessage: "Code is required." }),
                addressLine1: src_1.rules.str()
            }).required({ errorMessage: "Address is required" })
        }).required()
    });
    it("must correct build path for invalid most nested object", function (done) {
        utils_2.validateWithPromise({
            id: 23,
            delivery: {
                price: 5.4,
                address: {}
            }
        }, v).then(function () { return done("Must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "delivery.address.code": ["Code is required."]
            });
        }); });
    });
});
describe("for required nested objects", function () {
    var objectStructure = src_1.rules.obj({
        id: src_1.rules.num().required().must(function (v) { return v > 0; }, { errorMessage: "ID must be greater than zero" }),
        title: src_1.rules.str().required().must(function (s) { return s.length < 10; }),
        delivery: src_1.rules.obj({
            price: src_1.rules.num().required().must(function (v) { return v > 0; }),
            address: src_1.rules.str().required().notEmpty()
        }).required({ errorMessage: "Delivery data is required" })
    });
    it("should fail on nested object missing", function (done) {
        var invalidObject = {
            id: -10,
            title: "test"
        };
        utils_2.validateWithPromise(invalidObject, objectStructure)
            .then(function () { return done("Must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                id: ["ID must be greater than zero"],
                delivery: ["Delivery data is required"]
            });
        }); });
    });
});
describe("for optional nested objects", function () {
    var objectStructure = src_1.rules.obj({
        id: src_1.rules.num().required().must(function (v) { return v > 0; }),
        title: src_1.rules.str().required().must(function (s) { return s.length < 10; }),
        delivery: src_1.rules.obj({
            price: src_1.rules.num()
                .required({ errorMessage: "Price is required", stopOnFailure: false })
                .must(function (v) { return v > 0; }, { errorMessage: "Price must be greater than zero" }),
            address: src_1.rules.str().required().notEmpty()
        })
    });
    it("should pass valid object", function (done) {
        var validObject = {
            id: 10,
            title: "testtitle",
            delivery: {
                price: 15,
                address: "test address"
            }
        };
        utils_2.validateWithPromise(validObject, objectStructure)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.deepEqual({
                id: 10,
                title: "testtitle",
                delivery: {
                    price: 15,
                    address: "test address"
                }
            });
        }); })
            .catch(function () { return done("Must pass"); });
    });
    it("should pass valid object with null inner object", function (done) {
        var validObject = {
            id: 10,
            title: "testtitle"
        };
        utils_2.validateWithPromise(validObject, objectStructure)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.deepEqual({
                id: 10,
                title: "testtitle",
                delivery: undefined
            });
        }); })
            .catch(function (err) {
            done("Must pass!");
        });
    });
    it("should fail on invalid inner object data", function (done) {
        var invalidObject = {
            id: 20,
            title: "test",
            delivery: {
                address: "test address"
            }
        };
        utils_2.validateWithPromise(invalidObject, objectStructure)
            .then(function () { return done("Must fail!!"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "delivery.price": ["Price is required", "Price must be greater than zero"]
            });
        }); });
    });
});
describe("for expandable object", function () {
    var structure = src_1.rules.obj({
        id: src_1.rules.num().required().must(function (v) { return v > 10; }),
        title: src_1.rules.str().required().must(function (v) { return v.length < 20; })
    }).expandable();
    it("should preserve non-validatable properties", function (done) {
        var validObject = {
            id: 20,
            title: "test",
            delivery: {
                price: 20,
                address: "test address"
            }
        };
        utils_2.validateWithPromise(validObject, structure)
            .then(function (v) { return utils_1.assertBlock(done, function () {
            v.should.deepEqual({
                id: 20,
                title: "test",
                delivery: {
                    price: 20,
                    address: "test address"
                }
            });
        }); })
            .catch(function () { return done("Must pass"); });
    });
});
describe("for multiple validators", function () {
    var idValidator = src_1.rules.obj({
        id: src_1.rules.num()
            .required()
    }).expandable();
    var titleValidator = src_1.rules.obj({
        title: src_1.rules.str().required().must(function (t) { return t.length < 20; })
    }).expandable();
    var idValidityValidator = src_1.rules.obj({
        id: src_1.rules.num(false)
            .required()
            .must(function (v) {
            return isNaN(v) || v < 100;
        }, { errorMessage: "Id too large" })
    }).expandable();
    it("valid object must pass validator chain", function (done) {
        var validObject = {
            id: 5,
            title: "test"
        };
        utils_2.validateWithPromise(validObject, idValidator, titleValidator, idValidityValidator)
            .then(function (v) { return utils_1.assertBlock(done, function () {
        }); })
            .catch(function () { return done("Must pass"); });
    });
    it("must not stop if failed on first validator", function (done) {
        var invalidObject = {
            id: "sdfsdf",
            title: "test"
        };
        utils_2.validateWithPromise(invalidObject, idValidator.stopOnFail(false), titleValidator.stopOnFail(false), idValidityValidator.stopOnFail(false))
            .then(function () { return done("Must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                "id": ["Value is not a valid number.", "Value is not a valid number."]
            });
        }); });
    });
    it("validators must validate data converted by previous validator", function (done) {
        var invalidObject = {
            id: "400",
            title: "test"
        };
        utils_2.validateWithPromise(invalidObject, idValidator, titleValidator, idValidityValidator)
            .then(function () { return done("Must fail"); })
            .catch(function (err) { return utils_1.assertBlock(done, function () {
            err.should.deepEqual({
                id: ["Id too large"]
            });
        }); });
    });
});
