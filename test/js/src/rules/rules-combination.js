"use strict";
var rules_base_1 = require("./rules-base");
/**
 * Combines a set of rules into a one rule.
 * The new rule passes if one of specified rule passed.
 * If any of specified rule passed then new rule failed with given error message.
 */
function one(rules, options) {
    var opt = rules_base_1.ensureRuleOptions(options, {
        errorMessage: "Value is not valid."
    });
    throw new Error("");
}
exports.one = one;
