"use strict";
/**
 * Combines a set of rules into a one rule.
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
                            console.log("rule success");
                            doneCallback(true, convertedValue);
                            return;
                        }
                        else {
                            console.log("rule failed, stop on error = ", rule.stopOnFailure);
                            if (rule.stopOnFailure) {
                                console.log("stop on failure");
                                ruleContext = voidContext;
                            }
                            run();
                        }
                    }, ruleParsedValue, validatingObject, rootObject);
                }
                else {
                    console.log("validation failed");
                    bufferContext.flushErrors();
                    doneCallback(false, null);
                }
            };
            run();
        }
    };
}
exports.one = one;
