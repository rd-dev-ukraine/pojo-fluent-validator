import { ValidationRule, RuleOptions, IValidationContext } from "../definitions";
import { ensureRuleOptions } from "./rules-base";

/**
 * Combines a set of rules into a one rule.
 * The new rule passes if one of specified rule passed.
 * 
 * If no of specified rule passed then new rule failed with all errors produced by failed rules.
 * If rule in the set has stopOnFailure === true then error accumulating stops if such rule failed.
 * 
 */
export function one<T>(rules: ValidationRule<T>[], stopOnError: boolean = false): ValidationRule<T> {
    if (!rules || !rules.length) {
        throw new Error("Rule set is required.");
    }

    return {
        stopOnFailure: !!stopOnError,

        runParse(inputValue: any): T {
            return <T><any>inputValue;
        },

        runValidate(
            context: IValidationContext,
            doneCallback: (success: boolean, convertedValue: any) => void,
            parsedValue: any,
            validatingObject?: any,
            rootObject?: any): void {

            const rulesToRun = [...rules];

            const bufferContext = context.bufferErrors();
            const voidContext = context.create();

            let ruleContext = bufferContext;

            const run = () => {
                const rule = rulesToRun.shift();

                if (rule) {
                    const ruleParsedValue = rule.runParse(parsedValue, validatingObject, rootObject);

                    rule.runValidate(
                        ruleContext,
                        (success, convertedValue) => {
                            if (success) {
                                console.log("rule success")
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
                        },
                        ruleParsedValue,
                        validatingObject,
                        rootObject);
                }
                else {
                    console.log("validation failed");
                    bufferContext.flushErrors();
                    doneCallback(false, null);
                }
            };

            run();
        }
    }
}