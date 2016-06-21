/// <reference path="./typings/index.d.ts" />
"use strict";
var src_1 = require("../src");
function assertBlock(done, assertionBlock) {
    try {
        assertionBlock();
        done();
    }
    catch (e) {
        done(e);
    }
}
exports.assertBlock = assertBlock;
function validateWithPromise(value) {
    var validators = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        validators[_i - 1] = arguments[_i];
    }
    if (!validators || !validators.length) {
        throw new Error("At least one validator is required");
    }
    return new Promise(function (resolve, reject) {
        src_1.validate.apply(void 0, [value, function (result, errors) {
            if (errors) {
                reject(errors);
            }
            else {
                resolve(result);
            }
            ;
        }].concat(validators));
    });
}
exports.validateWithPromise = validateWithPromise;
