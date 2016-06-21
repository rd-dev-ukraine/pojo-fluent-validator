/// <reference path="./typings/index.d.ts" />

import { validate, ValidationRule  } from "../src";

export function assertBlock(done: MochaDone, assertionBlock: () => void) {
    try {
        assertionBlock();
        done();
    }
    catch (e) {
        done(e);
    }
}

export function validateWithPromise<T>(value: any, ...validators: ValidationRule<T>[]): Promise<T> {
    if (!validators || !validators.length) {
        throw new Error("At least one validator is required");
    }

    return new Promise((resolve, reject) => {
        validate(
            value,
            (result, errors) => {
                if (errors) {
                    reject(errors);
                }
                else {
                    resolve(result);
                };
            },
            ...validators);
    });
}