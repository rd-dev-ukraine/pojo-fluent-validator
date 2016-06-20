import { ValidationRule, IValidationContext } from "../definitions";
import { EnclosingValidationRuleBase } from "./rules-base";

export interface IHash<TElement> {
    [key: string]: TElement;
}

class HashValidationRuleCore<TElement> implements ValidationRule<IHash<TElement>> {

    constructor(
        private elementValidationRule: ValidationRule<TElement>,
        private skipInvalidElements: boolean,
        private filterHashFn: (key: string, value?: TElement, rawValue?: any) => boolean,
        public stopOnFailure) {

        if (!elementValidationRule) {
            throw new Error("Element validation rule required");
        }
    }

    runParse(hash: any, validatingObject?: any, rootObject?: any): IHash<TElement> {
        if (hash === null || hash === undefined) {
            return hash;
        }

        const result: IHash<TElement> = {};

        for (let key in hash) {
            const inputValue = hash[key];
            const parsedValue = this.elementValidationRule.runParse(inputValue, hash, rootObject);
            if (!this.filterHashFn || this.filterHashFn(key, parsedValue, inputValue)) {
                result[key] = parsedValue;
            }
        }

        return result;
    }

    runValidate(
        context: IValidationContext,
        doneCallback: (success: boolean) => void,
        hash: any,
        validatingObject?: any,
        rootObject?: any): void {

        const hashKeys: string[] = [];
        for (let key in hash) {
            hashKeys.push(key);
        }

        let valid = true;
        const run = () => {
            if (hashKeys.length) {
                const key = hashKeys.shift();
                const inputValue = hash[key];

                const keyContext = context.property(`${key}`).bufferErrors();

                this.elementValidationRule.runValidate(
                    keyContext,
                    success => {
                        if (this.skipInvalidElements) {
                            if (!success) {
                                delete hash[key];
                            }
                        }
                        else {
                            valid = valid && success;
                            keyContext.flushErrors();
                        }

                        run();
                    },
                    inputValue,
                    hash,
                    rootObject);
            }
            else {
                doneCallback(valid);
            }
        };

        run();
    }
}

export class HashValidationRule<TElement> extends EnclosingValidationRuleBase<IHash<TElement>> {

    constructor(
        private elementValidationRule: ValidationRule<TElement>,
        private skipInvalidElementsProp: boolean,
        private filterHashFn: (key: string, value?: TElement) => boolean,
        private stopOnMainRuleFailure) {

        super(new HashValidationRuleCore<TElement>(elementValidationRule, skipInvalidElementsProp, filterHashFn, stopOnMainRuleFailure));
    }

    protected clone(): this {
        return <this>new HashValidationRule<TElement>(
            this.elementValidationRule,
            this.skipInvalidElementsProp,
            this.filterHashFn,
            this.stopOnMainRuleFailure);
    }

    /**
     * Don't fail on invalid element. Instead don't include invalid elements in result hash.
     * Note new rule never fails instead return empty hash.
     */
    skipInvalidElements(skipInvalidElements = true): this {
        this.skipInvalidElementsProp = skipInvalidElements;

        return this.makeCopy();
    }

    /** Filter result hash by applying predicate to each hash item and include only items passed the test. */
    filter(predicate: (key: string, value?: TElement) => boolean): this {
        if (!predicate) {
            throw new Error("Predicate is required.");
        }

        this.filterHashFn = predicate;

        return this.makeCopy();
    }

    private makeCopy(): this {
        return this.withMainRule(
            new HashValidationRule<TElement>(
                this.elementValidationRule,
                this.skipInvalidElementsProp,
                this.filterHashFn,
                this.stopOnMainRuleFailure));
    }
}


/**
 * Validates a map of objects with the same structure.
 */
export function hash<TElement>(elementValidationRule: ValidationRule<TElement>, stopOnFailure = true): HashValidationRule<TElement> {
    if (!elementValidationRule) {
        throw new Error("Element validation rule is required.");
    }

    return new HashValidationRule<TElement>(elementValidationRule, false, null, stopOnFailure);
}

