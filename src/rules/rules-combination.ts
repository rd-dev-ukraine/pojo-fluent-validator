import { ValidationRule, RuleOptions, IValidationContext } from "../definitions";
import { ensureRuleOptions } from "./rules-base";

/**
 * Combines a set of rules into a new rule.
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
                                doneCallback(true, convertedValue);
                                return;
                            }
                            else {
                                if (rule.stopOnFailure) {
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
                    bufferContext.flushErrors();
                    doneCallback(false, null);
                }
            };

            run();
        }
    };
}

/**
 * Combines a set of rules into a new rule.
 * New rule passed if all rules are passed. Value is converted by each rule using previous value as input.
 *
 * If some of rules failed validation will continue until failed rule has stopOnError==true. 
 * The errors from failed rules will be merged. 
 */
export function all<T>(rules: ValidationRule<T>[], stopOnError: boolean = false): ValidationRule<T> {
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

            let value = parsedValue;
            let allRulesOk = true;

            const run = () => {
                const rule = rulesToRun.shift();

                if (rule) { 

                    const ruleParsedValue = rule.runParse(value, validatingObject, rootObject);

                    rule.runValidate(
                        context,
                        (success, convertedValue) => {
                            if (success) {
                                value = convertedValue;
                            }
                            else {
                                if (rule.stopOnFailure) {
                                    doneCallback(false, null);
                                    return;
                                }
                            }

                            allRulesOk = allRulesOk && success;

                            run();
                        },
                        ruleParsedValue,
                        validatingObject,
                        rootObject);
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