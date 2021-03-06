import { RuleOptions } from "../definitions";
import { SequentialRuleSet, ensureRuleOptions } from "./rules-base";

export class StringRules extends SequentialRuleSet<string> {

    protected clone(): this {
        return <this>new StringRules();
    }

    /** 
     * Checks if value has string type. Undefined value is passed as correct. 
     * This rule is applied automatically, don't add call this method manually.
     */
    isString(options?: RuleOptions): this {
        options = ensureRuleOptions(options, {
            errorMessage: "Value must be a string.",
            stopOnFailure: true
        });

        return this.parseAndValidate(
            null,
            (done, value) => {
                if (value && typeof value !== "string") {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }

    /** Converts value to string. */
    parseString(options?: RuleOptions): this {
        options = ensureRuleOptions(options, {
            errorMessage: "Value must be a string.",
            stopOnFailure: true
        })

        return this.parse(
            v => {
                if (!v) {
                    return "";
                }

                return "" + v;
            },
            options);
    }

    /** Checks if string is not null or whitespaced. */
    notEmpty(options?: RuleOptions): this {

        options = ensureRuleOptions(options, {
            errorMessage: "Value can not be empty.",
            stopOnFailure: true
        });

        return this.parseAndValidate(
            null,
            (done, parsedValue) => {
                if (!parsedValue || parsedValue.trim().length === 0) {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }

    /** Checks string maximum length. */
    maxLength(maxLength: number, options?: RuleOptions): this {
        if (maxLength <= 0) {
            throw new Error("Max length must be greater than zero.");
        }
        options = ensureRuleOptions(options, {
            errorMessage: "Value is too long.",
            stopOnFailure: false
        });

        return this.parseAndValidate(
            null,
            (done, value) => {
                if (value && value.length > maxLength) {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }

    /** Checks string minimum length. */
    minLength(minLength: number, options?: RuleOptions): this {
        if (minLength <= 0) {
            throw new Error("Min length must be greater than zero.");
        }

        options = ensureRuleOptions(options, {
            errorMessage: "Value is too short.",
            stopOnFailure: false
        });

        return this.parseAndValidate(
            null,
            (done, value) => {
                if (value && value.length < minLength) {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }
}

export class NumberRules extends SequentialRuleSet<number> {

    protected clone(): NumberRules {
        return new NumberRules();
    }

    /** 
     * Checks if value is number. Null or undefined values are passed as correct. 
     * This rule is applied automatically, don't call it. 
     */
    isNumber(options?: RuleOptions): this {
        options = ensureRuleOptions(options, {
            errorMessage: "Value is not valid number.",
            stopOnFailure: true
        });

        return this.parseAndValidate(
            null,
            (done, value) => {
                if (value === null || value === undefined || <any>value === "") {
                    done();
                    return;
                }

                if (typeof value !== "number") {
                    done(options.errorMessage);
                    return;
                }

                done();
            },
            options.stopOnFailure);
    }

    /**
     * Parses number.
     */
    parseNumber(options?: RuleOptions): this {
        options = ensureRuleOptions(options, {
            errorMessage: "Value is not valid number.",
            stopOnFailure: false
        });

        const failResult = new Object();

        return this.parseAndValidate(
            (inputValue, validatingObject, rootObject) => {
                if (inputValue === null || inputValue === undefined || inputValue === "") {
                    return inputValue;
                }

                const converted = parseFloat(inputValue);
                if (converted === null || converted === undefined || isNaN(converted)) {
                    return <number><any>failResult;
                }

                return converted;
            },
            (done, convertedValue, obj, root) => {
                if (convertedValue == failResult) {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }
}


export function str(convert: boolean = true, options?: RuleOptions): StringRules {
    options = ensureRuleOptions(options, {
        errorMessage: "Value is not a string.",
        stopOnFailure: true
    });

    if (convert) {
        return new StringRules().parseString(options);
    }
    else {
        return new StringRules().isString(options);
    }
}

export function num(convert: boolean = true, options?: RuleOptions): NumberRules {
    options = ensureRuleOptions(options, {
        errorMessage: "Value is not a valid number.",
        stopOnFailure: true
    });

    if (convert) {
        return new NumberRules().parseNumber(options);
    }
    else {
        return new NumberRules().isNumber(options);
    }
}
