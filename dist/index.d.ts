/**
 * Structure contains validation errors with results of validation.
 * The validation errors contained in dictionary where key is path to validated value
 * which may includes property access and indexer operations.
 * 
 * Also validation errors may contains optonal summary message with empty-string key describes object-wide errors.
 */
export declare interface ValidationErrorHash {
    /** Object-wide validation messages. */
    [""]?: string[];
    /** Validation messages for properties and indexes of object, including ones with more than one nesting level. */
    [path: string]: string[];
}

export declare interface RuleOptions {
    errorMessage?: string;
    stopOnFailure?: boolean;
}

/**
 * Validation context allows reporting errors for current validation stage and
 * creation nested context of different type.
 */
export declare interface IValidationContext {
    /** Creates new independent validation context instance. */
    create(): IValidationContext;

    /** Writes an error message to error accumulator for this context. */
    reportError(errorMessage: string): void;
    /** Creates nested validation context represents property of the object. */
    property(propertyName: string, errorCallback?: (errorMessage: string) => boolean): IValidationContext;
    /** Creates nested validation context represents array element access by index. */
    index(index: number, errorCallback?: (errorMessage: string) => boolean): IValidationContext;

    /** Creates a copy of current validation context which don't put errors into inner error accumulator until flush method called. */
    bufferErrors(): IValidationContext;

    /** Clears the error buffer. */
    discardErrorBuffer(): void;

    /** Flushed buffered errors to inner error accumulator. */
    flushErrors(): void;
}

/**
 * Represents a single piece of validation logic.
 * 
 * Each validation rule consists of two stages - parsing and validation.
 * Parsing is sync and must converts the type of the input value.
 * Validation is optionally async and should checks parsed value for validity.
 * 
 * Parsing stage is unable to report errors. Instead it should return a value recognizable by validation stage and report errors there. 
 * 
 * Validation stage receives parsed value. 
 * If value is complex like object or array the parsing should be performed on whole object before validation.
 * This enables to pass parsed values as validatingObject parameter. 
 */
export declare interface ValidationRule<T> {
    /**
     * Gets a value determines whether next rules must be run if current rules failed validation stage.
     */
    stopOnFailure: boolean;

    /**
     * Parse value before performing a validation.
     * If parsing is failed it should return some value recognizable by the validate method.
     * 
     */
    runParse(inputValue: any, validatingObject?: any, rootObject?: any): T;

    /**
     * Run validation logic on specified input value.
     * 
     * param @context Validation context allows report errors for current value and create context for nested validation.
     * param @doneCallback Callback called when validation is completed. 
     *             Accepts boolean value determines whether conversion was successful. 
     * param @parsedValue Parsed value returned by parsing stage.
     * param @validatingObject Object which property or element being validated currently.
     * param @rootObject Object on which validation was run.
     */
    runValidate(context: IValidationContext,
        doneCallback: (success: boolean, convertedValue: any) => void,
        parsedValue: any,
        validatingObject?: any,
        rootObject?: any): void;
}

/**
 * Runs validation of the given @value. When validation completes, the @done callback will be called.
 * 
 * param @value Value to validate.
 * param @done Callback which will be called when validation completes.
 */
export declare function validate<T>(
    value: any,
    doneCallback: (errors: ValidationErrorHash, convertedValue: T) => void,
    ...validators: ValidationRule<T>[]): void;

export declare namespace rules {

    /**
     * Base class which can contain a set of rules which runs sequentially, accumulates errors. 
     * Each next rule validates conversion result of previous rule if successful or last successful value or input. 
     */
    export abstract class SequentialRuleSet<T> implements ValidationRule<T> {
        stopOnFailure: boolean;
        runParse(inputValue: any, validatingObject?: any, rootObject?: any): T;
        runValidate(context: IValidationContext,
            doneCallback: (success: boolean, convertedValue: any) => void,
            parsedValue: any,
            validatingObject?: any,
            rootObject?: any): void;

        /** 
         * Adds a rule which uses custom functions for validation and converting.
         * If parsing function is not provided value is passed to validation function without conversion.
         * Note: if validation function should also perform value conversion 
         * you would probably need to manually create class implements ValidationRule 
         */
        parseAndValidate(
            parseFn: (inputValue: any, validatingObject?: any, rootObject?: any) => T,
            validationFn: (doneCallback: (errorMessage?: string) => void, parsedValue: T, validatingObject?: any, rootObject?: any) => void,
            stopOnFailure?: boolean): this;

        /** Fails if input value is null or undefined. */
        required(options?: RuleOptions): this;

        /** 
         * Parses input value.
         * Parse rules runs first.
         * If transformation function returns null or undefined or throws an error fails with specified error message.
         */
        parse(convertFn: (inputValue: any, validatingObject?: any, rootObject?: any) => T, options?: RuleOptions): this;

        /**
         * Checks the value using custom function. Function must return true if value is valid and false otherwise.
         */
        must(predicate: (value: T, validatingObject?: any, rootObject?: any) => boolean, options?: RuleOptions): this;

        /**
         * Stops executing next rules if this rule failed.
         * This flag affects final rule itself, not inner rules configures with fluent methods. 
         */
        stopOnError(stopValidationOnError?: boolean): this;
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

        constructor(rule: ValidationRule<T>);

        stopOnFailure: boolean;
        runParse(inputValue: any, validatingObject?: any, rootObject?: any): T;
        runValidate(context: IValidationContext,
            doneCallback: (success: boolean, convertedValue: any) => void,
            parsedValue: any,
            validatingObject?: any,
            rootObject?: any): void;

        /** Configures whether rules after the current rule should run if current rule failed. */
        stopOnFail(stopOnFailure: boolean): this;

        /** Disables null object. */
        required(options?: RuleOptions): this;

        /** Adds a rule which is run before validation. */
        runBefore(rule: ValidationRule<T>): this;

        /** Adds a rule which is run after validation. */
        runAfter(rule: ValidationRule<T>): this;

        /** Checks the object before main rule run. */
        before(predicate: (obj: T, validatingObject?: any, rootObject?: any) => boolean, options?: RuleOptions): this;

        /** Checks the object after main rule run. */
        after(predicate: (obj: T, validatingObject?: any, rootObject?: any) => boolean, options?: RuleOptions): this;
    }

    export class AnyRules<T> extends SequentialRuleSet<T> {
        constructor(stopOnFailure: boolean);
    }

    /** Validation rules for strings. */
    export class StringRules extends SequentialRuleSet<string> {
        /** 
         * Checks if value has string type. Undefined value is passed as correct. 
         * This rule is applied automatically, don't add call this method manually.
         */
        isString(options?: RuleOptions): this;

        /** Converts value to string. */
        parseString(options?: RuleOptions): this;

        /** Checks if string is not null or whitespaced. */
        notEmpty(options?: RuleOptions): this;

        /** Checks string maximum length. */
        maxLength(maxLength: number, options?: RuleOptions): this;

        /** Checks string minimum length. */
        minLength(minLength: number, options?: RuleOptions): this;
    }

    /** Validation rules for numbers. */
    export class NumberRules extends SequentialRuleSet<number> {
        /** 
         * Checks if value is number. Null or undefined values are passed as correct. 
         * This rule is applied automatically, don't call it. 
         */
        isNumber(options?: RuleOptions): this;

        /**
         * Parses number.
         */
        parseNumber(options?: RuleOptions): this;
    }

    /** Configuration object for ObjectValidationRule. */
    export interface IPropertyValidationHash {
        [property: string]: ValidationRule<any>;
    }

    /** Object with properties. */
    export interface IObject {
        [property: string]: any;
    }

    /** Validation rules for object. */
    export class ObjectValidationRule<T extends IObject> extends EnclosingValidationRuleBase<T> {
        constructor(properties: IPropertyValidationHash, isExpandable: boolean, stopsOnMainRuleFailure: boolean);

        /** Configures that object may contains more properties than specified in configuration. */
        expandable(): this;
    }

    /** Map of elements with the same structure. */
    export interface IHash<TElement> {
        [key: string]: TElement;
    }

    export class HashValidationRule<TElement> extends EnclosingValidationRuleBase<IHash<TElement>> {
        constructor(
            elementValidationRule: ValidationRule<TElement>,
            skipInvalidElementsProp: boolean,
            filterHashFn: (key: string, value?: TElement) => boolean,
            stopOnMainRuleFailure: boolean);

        /**
         * Don't fail on invalid element. Instead don't include invalid elements in result hash.
         * Note new rule never fails instead return empty hash.
         */
        skipInvalidElements(skipInvalidElements?: boolean): this;

        /** Filter result hash by applying predicate to each hash item and include only items passed the test. */
        filter(predicate: (key: string, value?: TElement) => boolean): this;
    }

    /** Validation rules for array. */
    export class ArrayValidationRule<TElement> extends EnclosingValidationRuleBase<TElement[]> {
        constructor(
            elementValidationRule: ValidationRule<TElement>,
            skipInvalidElementsProp: boolean,
            filterElementFn: (element: TElement, index?: number) => boolean,
            stopOnMainRuleFailure: boolean);

        /**
         * Don't fail on invalid element. Instead don't include invalid elements in result array.
         * Note new rule never fails instead it returns empty array.
         */
        skipInvalidElements(skipInvalidElements?: boolean): this;

        /** Filter result array by applying predicate to each hash item and include only items passed the test. */
        filter(predicate: (element: TElement, index?: number) => boolean): this;
    }

    /** Validates any value using given predicate. */
    export function any<T>(predicate?: (value: T, entity?: any, rootEntity?: any) => boolean, options?: RuleOptions): AnyRules<T>;

    /** Validates if value is string. */
    export function str(convert?: boolean, options?: RuleOptions): StringRules;

    /** Validates if value is number. */
    export function num(convert?: boolean, options?: RuleOptions): NumberRules;

    /** Validates object. */
    export function obj<T>(properties: IPropertyValidationHash, stopOnFailure?: boolean): ObjectValidationRule<T>;

    /**
     * Validates a map of objects with the same structure.
     */
    export function hash<TElement>(elementValidationRule: ValidationRule<TElement>, stopOnFailure?: boolean): HashValidationRule<TElement>;

    /** Validates an array of the elements with the same structure. */
    export function arr<TElement>(elementValidationRule: ValidationRule<TElement>, stopOnFailure?: boolean): ArrayValidationRule<TElement>;

    /**
     * Combines a set of rules into a one rule.
     * The new rule passes if one of specified rule passed.
     * If no of specified rule passed then new rule failed with all errors produced by failed rules.
     * If rule in the set has stopOnFailure === true then error accumulating stops if such rule failed.
     * 
     */
    export function one<T>(rules: ValidationRule<T>[], stopOnError?: boolean): ValidationRule<T>
}
