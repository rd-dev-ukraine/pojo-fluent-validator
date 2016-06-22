"use strict";
/**
 * Combines a set of rules into a new rule.
 * The new rule passes if one of specified rule passed.
 *
 * If no of specified rule passed then new rule failed with all errors produced by failed rules.
 * If rule in the set has stopOnFailure === true then error accumulating stops if such rule failed.
 *
 */
function one(rules, stopOnError) {
    if (stopOnError === void 0) { stopOnError = false; }
    if (!rules || !rules.length) {
        throw new Error("Rule set is required.");
    }
    return {
        stopOnFailure: !!stopOnError,
        runParse: function (inputValue) {
            return inputValue;
        },
        runValidate: function (context, doneCallback, parsedValue, validatingObject, rootObject) {
            var rulesToRun = rules.slice();
            var bufferContext = context.bufferErrors();
            var voidContext = context.create();
            var ruleContext = bufferContext;
            var run = function () {
                var rule = rulesToRun.shift();
                if (rule) {
                    var ruleParsedValue = rule.runParse(parsedValue, validatingObject, rootObject);
                    rule.runValidate(ruleContext, function (success, convertedValue) {
                        if (success) {
                            doneCallback(true, convertedValue);
                            return;
                        }
                        else {
                            if (rule.stopOnFailure) {
                                ruleContext = voidContext;
                            }
                            run();
                        }
                    }, ruleParsedValue, validatingObject, rootObject);
                }
                else {
                    bufferContext.flushErrors();
                    doneCallback(false, null);
                }
            };
            run();
        }
    };
}
exports.one = one;
/**
 * Combines a set of rules into a new rule.
 * New rule passed if all rules are passed. Value is converted by each rule using previous value as input.
 *
 * If some of rules failed validation will continue until failed rule has stopOnError==true.
 * The errors from failed rules will be merged.
 */
function all(rules, stopOnError) {
    if (stopOnError === void 0) { stopOnError = false; }
    if (!rules || !rules.length) {
        throw new Error("Rule set is required.");
    }
    return {
        stopOnFailure: !!stopOnError,
        runParse: function (inputValue) {
            return inputValue;
        },
        runValidate: function (context, doneCallback, parsedValue, validatingObject, rootObject) {
            var rulesToRun = rules.slice();
            var value = parsedValue;
            var allRulesOk = true;
            console.log("all run validate");
            var run = function () {
                var rule = rulesToRun.shift();
                if (rule) {
                    console.log("run rule");
                    var ruleParsedValue = rule.runParse(value, validatingObject, rootObject);
                    rule.runValidate(context, function (success, convertedValue) {
                        console.log("run rule result " + success);
                        if (success) {
                            value = convertedValue;
                        }
                        else {
                            console.log("rule failed, stop on error = ", rule.stopOnFailure);
                            if (rule.stopOnFailure) {
                                doneCallback(false, null);
                                return;
                            }
                        }
                        allRulesOk = allRulesOk && success;
                        run();
                    }, ruleParsedValue, validatingObject, rootObject);
                }
                else {
                    if (allRulesOk) {
                        doneCallback(true, value);
                    }
                    else {
                        doneCallback(false, null);
                    }
                }
            };
            run();
        }
    };
}
exports.all = all;
