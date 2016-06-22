"use strict";
var error_accumulator_1 = require("./error-accumulator");
var validation_context_1 = require("./validation-context");
var rules = require("./rules");
exports.rules = rules;
function validate(value, doneCallback) {
    var validators = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        validators[_i - 2] = arguments[_i];
    }
    if (!doneCallback) {
        throw new Error("Done callback is required.");
    }
    if (!validators || !validators.length) {
        throw new Error("At least one validator is required");
    }
    var errorAccumulator = new error_accumulator_1.default();
    var validationContext = new validation_context_1.default("", errorAccumulator);
    var rule = rules.combineRules.apply(rules, validators);
    var parsedValue = rule.runParse(value, value, value);
    rule.runValidate(validationContext, function () {
        if (errorAccumulator.valid()) {
            doneCallback(null, parsedValue);
        }
        else {
            doneCallback(errorAccumulator.errors(), null);
        }
    }, parsedValue, parsedValue, parsedValue);
}
exports.validate = validate;
