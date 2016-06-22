import { ValidationRule, RuleOptions } from "../definitions";
import { ensureRuleOptions } from "./rules-base";

/**
 * Combines a set of rules into a one rule.
 * The new rule passes if one of specified rule passed.
 * If any of specified rule passed then new rule failed with given error message.
 */
export function one<T>(rules: ValidationRule<T>[], options?: RuleOptions): ValidationRule<T> {
    const opt = ensureRuleOptions(options, {
        errorMessage: "Value is not valid."
    });

    throw new Error("");
}