import { ValidationRule, ValidationErrorHash } from "./definitions";
import ErrorAccumulator from "./error-accumulator";
import ValidationContext from "./validation-context";

import * as rules from "./rules";

export * from "./definitions";
export { rules };

export function validate<T>(
    value: any,
    doneCallback: (convertedValue: T, errors: ValidationErrorHash) => void,
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
        () => {
            if (errorAccumulator.valid()) {
                doneCallback(parsedValue, null);
            }
            else {
                doneCallback(null, errorAccumulator.errors());
            }
        },
        parsedValue,
        parsedValue,
        parsedValue);
}