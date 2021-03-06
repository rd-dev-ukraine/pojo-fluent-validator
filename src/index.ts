import { ValidationRule, ValidationErrorHash } from "./definitions";
import ErrorAccumulator from "./error-accumulator";
import ValidationContext from "./validation-context";

import * as rules from "./rules";

export * from "./definitions";
export { rules };

export function validate<T>(
    value: any,
    doneCallback: (errors: ValidationErrorHash, convertedValue: T) => void,
    ...validators: ValidationRule<T>[]): void {
    if (!doneCallback) {
        throw new Error("Done callback is required.");
    }
    if (!validators || !validators.length) {
        throw new Error("At least one validator is required");
    }

    const errorAccumulator = new ErrorAccumulator();
    const validationContext = new ValidationContext("", errorAccumulator);

    const rule = rules.combineRules(...validators);

    const parsedValue = rule.runParse(value, value, value);

    rule.runValidate(
        validationContext,
        (success, convertedValue) => {
            if (errorAccumulator.valid()) {
                doneCallback(null, convertedValue);
            }
            else {
                doneCallback(errorAccumulator.errors(), null);
            }
        },
        parsedValue,
        parsedValue,
        parsedValue);
}