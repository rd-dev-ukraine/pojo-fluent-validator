import { ValidationRule, IValidationContext, RuleOptions } from "../definitions";

export function ensureRuleOptions(options: RuleOptions, defaultRuleOptions: RuleOptions): RuleOptions {
    options = options || defaultRuleOptions;
    if (!options) {
        throw new Error("Options is required");
    }

    if (defaultRuleOptions.stopOnFailure === null || defaultRuleOptions.stopOnFailure === undefined) {
        defaultRuleOptions.stopOnFailure = false;
    }

    if (options.stopOnFailure === null || options.stopOnFailure === undefined) {
        options.stopOnFailure = defaultRuleOptions.stopOnFailure;
    }

    const result: RuleOptions = {
        errorMessage: options.errorMessage || defaultRuleOptions.errorMessage,
        stopOnFailure: options.stopOnFailure
    };

    if (!result.errorMessage) {
        throw new Error("Error message is required.");
    }

    return result;
}

/** 
 * Combines rules array into single rule which runs all rules.
 * Parsing stage is run for all rules one by one using previous rule result as input for next rule.
 * Validation stage is run for all rules sequentially but stops if rule with stopOnFailure = true is failed.  
 */
export function combineRules<T>(...rules: ValidationRule<T>[]): ValidationRule<T> {
    rules = rules || [];

    return {
        stopOnFailure: false,
        /** Runs parsing on all rules. */
        runParse(inputValue: any, validatingObject?: any, rootObject?: any): T {
            return rules.reduce((currentValue, rule) => rule.runParse(currentValue, validatingObject, rootObject), inputValue);
        },
        /** Runs all chained rules. */
        runValidate(context: IValidationContext,
            doneCallback: (success: boolean, convertedValue: any) => void,
            parsedValue: any,
            validatingObject?: any,
            rootObject?: any): void {
            if (!context) {
                throw new Error("context is required.");
            }
            if (!doneCallback) {
                throw new Error("done callback is required.");
            }

            const rulesToRun = [...rules];

            let allRulesValid = true;
            let convertedValue = parsedValue;

            const runRule = () => {
                const rule = rulesToRun.shift();
                if (rule) {
                    rule.runValidate(
                        context,
                        (success, ruleConvertedValue) => {
                            if (!success && rule.stopOnFailure) {
                                doneCallback(false, null);
                                return;
                            }

                            if (success) {
                                convertedValue = ruleConvertedValue;
                            }

                            allRulesValid = allRulesValid && success;

                            // Runs next rule recursively
                            runRule();
                        },
                        convertedValue,
                        validatingObject,
                        rootObject);
                }
                else {
                    doneCallback(allRulesValid, convertedValue);
                }
            };

            runRule();
        }
    };
}

/**
 * Base class which can contain a set of rules which runs sequentially, 
 * accumulates errors. 
 * Each next rule validates conversion result of previous rule if successful or last successful value or input. 
 */
export abstract class SequentialRuleSet<T> implements ValidationRule<T> {
    private rules: ValidationRule<T>[] = [];

    stopOnFailure = false;

    /** Runs parsing on all rules. */
    runParse(inputValue: any, validatingObject?: any, rootObject?: any): T {
        return combineRules(...this.rules).runParse(inputValue, validatingObject, rootObject);
    }

    /** Runs all chained rules. */
    runValidate(
        context: IValidationContext,
        doneCallback: (success: boolean, convertedValue: any) => void,
        parsedValue: any,
        validatingObject?: any,
        rootObject?: any): void {

        if (!context) {
            throw new Error("context is required.");
        }
        if (!doneCallback) {
            throw new Error("done callback is required.");
        }

        combineRules(...this.rules).runValidate(
            context,
            doneCallback,
            parsedValue,
            validatingObject,
            rootObject
        );
    }

    /**
     * Stops executing next rules if this rule failed.
     * This flag affects final rule itself, not inner rules configures with fluent methods. 
     */
    stopOnError(stopValidationOnError: boolean = true): this {        
        const copy = this.clone();

        copy.stopOnFailure = !!stopValidationOnError;
        copy.rules = this.rules;

        return <this>copy;
    }

    /** 
     * Adds a rule which uses custom functions for validation and converting. 
     * If parsing function is not provided value is passed to validation function without conversion. 
     */
    parseAndValidate(
        parseFn: (inputValue: any, validatingObject?: any, rootObject?: any) => T,
        validationFn: (doneCallback: (errorMessage?: string) => void, parsedValue: T, validatingObject?: any, rootObject?: any) => void,
        stopOnFailure = false): this {

        if (!validationFn) {
            throw new Error("Validation function is required.");
        }

        parseFn = (parseFn || (input => input));

        return this.withRule(
            {
                stopOnFailure: stopOnFailure,

                runParse: parseFn,

                runValidate(
                    context: IValidationContext,
                    done: (success: boolean, convertedValue: any) => void,
                    inputValue: any,
                    validatingObject?: any,
                    rootObject?: any): void {

                    validationFn(
                        (errorMessage) => {
                            if (errorMessage) {
                                context.reportError(errorMessage);
                                done(false, null);
                            }
                            else {
                                done(true, inputValue);
                            }
                        },
                        inputValue,
                        validatingObject,
                        rootObject);
                }
            });
    }

    /** Fails if input value is null or undefined. */
    required(options?: RuleOptions): this {
        options = ensureRuleOptions(options, { errorMessage: "Value is required.", stopOnFailure: true });

        return this.parseAndValidate(
            null,
            (done, input) => {
                if (input === null || input === undefined) {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }

    /** 
     * Parses input value.
     * Parse rules runs first.
     * If transformation function returns null or undefined or throws an error fails with specified error message.
     */
    parse(convertFn: (inputValue: any, validatingObject?: any, rootObject?: any) => T, options?: RuleOptions): this {
        if (!convertFn) {
            throw new Error("Transformation function is required.")
        }

        options = ensureRuleOptions(options, {
            errorMessage: "Conversion failed.",
            stopOnFailure: true
        });

        return this.withRule({
            stopOnFailure: options.stopOnFailure,
            runParse(inputValue: any, validatingObject?: any, rootObject?: any): T {
                return inputValue;
            },
            runValidate(
                context: IValidationContext,
                doneCallback: (success: boolean, convertedValue: any) => void,
                parsedValue: any,
                validatingObject?: any,
                rootObject?: any): void {
                try {
                    const converted = convertFn(parsedValue, validatingObject, rootObject);

                    if (converted === null || converted === undefined) {
                        context.reportError(options.errorMessage);
                        doneCallback(false, null);
                    }
                    else {
                        doneCallback(true, converted);
                    }
                }
                catch (e) {
                    context.reportError(options.errorMessage);
                    doneCallback(false, null);
                }
            }
        });
    }

    /**
     * Checks the value using custom function. Function must return true if value is valid and false otherwise.
     */
    must(predicate: (value: T, validatingObject?: any, rootObject?: any) => boolean, options?: RuleOptions): this {
        if (!predicate) {
            throw new Error("Predicate is required.");
        }

        options = ensureRuleOptions(options, {
            errorMessage: "Value is not valid.",
            stopOnFailure: false
        });

        return this.parseAndValidate(
            null,
            (done, input, obj, root) => {
                if (!predicate(input, obj, root)) {
                    done(options.errorMessage);
                }
                else {
                    done();
                }
            },
            options.stopOnFailure);
    }

    protected withRule(rule: ValidationRule<T>): this {
        if (!rule) {
            throw new Error("rule is required");
        }

        const copy = this.clone();

        copy.stopOnFailure = this.stopOnFailure;
        copy.rules = [...this.rules, rule];

        return <this>copy;
    }

    protected abstract clone(): SequentialRuleSet<T>;
}

/** 
 * Encapsulates rule enclosed in set of rules run before and after the rule.
 * 
 * Parsing only run for main rule. All other rules uses main rule parsing result as input.
 * 
 * The main rule is run only if all rules run before has been run successfuly.
 * The rules to run after would be only run if main rule run successfuly.
 * 
 * Enclosing rule would be run successfuly only if all rules (before, main and after) has run successfuly.  
 */
export abstract class EnclosingValidationRuleBase<T> implements ValidationRule<T> {
    private rulesBefore: ValidationRule<T>[] = [];
    private rulesAfter: ValidationRule<T>[] = [];

    stopOnFailure = false;

    constructor(protected rule: ValidationRule<T>) {
        if (!rule) {
            throw new Error("Validation rule is required.");
        }
    }

    runParse(inputValue: any, validatingObject?: any, rootObject?: any): T {
        return combineRules(this.rule).runParse(inputValue, validatingObject, rootObject);
    }

    runValidate(
        context: IValidationContext,
        doneCallback: (success: boolean, convertedValue: any) => void,
        obj: any,
        validatingObject?: any,
        rootObject?: any): void {

        const all = [
            ...(this.rulesBefore || []),
            this.rule,
            ...(this.rulesAfter || [])
        ];

        combineRules(...all).runValidate(
            context,
            doneCallback,
            obj,
            validatingObject,
            rootObject);

    }

    /** Configures whether rules after the current rule should run if current rule failed. */
    stopOnFail(stopOnFailure: boolean = true): this {
        const copy = this.clone();

        copy.stopOnFailure = stopOnFailure;

        return <this>copy;
    }

    /** Disables null object. */
    required(options?: RuleOptions): this {

        options = ensureRuleOptions(options, {
            errorMessage: "Object is required.",
            stopOnFailure: true
        });

        const result = this.copy();

        result.rulesBefore = [any<T>(v => v !== null && v !== undefined, options), ...result.rulesBefore];

        return result;
    }

    /** Adds a rule which is run before validation. */
    runBefore(rule: ValidationRule<T>): this {
        if (!rule) {
            throw new Error("rule is required");
        }

        const result = this.copy();
        result.rulesBefore = [...this.rulesBefore, rule];

        return result;
    }

    /** Adds a rule which is run after validation. */
    runAfter(rule: ValidationRule<T>): this {
        if (!rule) {
            throw new Error("rule is required");
        }

        const result = this.copy();
        result.rulesAfter = [...this.rulesAfter, rule];

        return result;
    }

    /** Checks the object before main rule run. */
    before(predicate: (obj: T, validatingObject?: any, rootObject?: any) => boolean, options?: RuleOptions): this {
        if (!predicate) {
            throw new Error("Predicate is required.");
        }

        return this.runBefore(any<T>(predicate, options));
    }

    /** Checks the object after main rule run. */
    after(predicate: (obj: T, validatingObject?: any, rootObject?: any) => boolean, options?: RuleOptions): this {
        if (!predicate) {
            throw new Error("Predicate is required.");
        }

        return this.runAfter(any<T>(predicate, options));
    }

    protected withMainRule(rule: ValidationRule<T>): this {
        if (!rule) {
            throw new Error("Rule is required.");
        }

        const result = this.copy();
        result.rule = rule;

        return result;
    }

    protected abstract clone(): this;

    private copy(): this {
        const result = this.clone();

        result.rulesBefore = [...this.rulesBefore];
        result.rulesAfter = [...this.rulesAfter];
        result.stopOnFailure = this.stopOnFailure;

        return result;
    }
}

export class AnyRules<T> extends SequentialRuleSet<T> {
    constructor(stopOnFailure: boolean) {
        super();
        this.stopOnFailure = stopOnFailure;
    }

    protected clone(): AnyRules<T> {
        return new AnyRules<T>(this.stopOnFailure);
    }
}

/** Validates any value using given predicate. */
export function any<T>(predicate?: (value: T, entity?: any, rootEntity?: any) => boolean, options?: RuleOptions): AnyRules<T> {
    options = ensureRuleOptions(options, {
        errorMessage: "Value is not valid",
        stopOnFailure: false
    });

    predicate = predicate || (v => true);
    return new AnyRules<T>(options.stopOnFailure).must(predicate, options);
}