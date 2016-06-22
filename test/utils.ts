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
            (errors, result) => {
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

export function shouldFail<T>(result: Promise<T>, done: MochaDone, assertError: (err: any) => void): void {
    result
        .then(v => done(new Error("Must fail but passed with result " + JSON.stringify(v))))
        .catch(err => {
            try {
                assertError(err);
                done();
            }
            catch (e) {
                done(e);
            }
        });
}

export function shouldPass<T>(result: Promise<T>, done: MochaDone, assertResult: (result: any) => void): void {
    result
        .then(result => {
            try {
                assertResult(result);
                done();
            }
            catch (e) {
                done(e);
            }
        })
        .catch(err => done(new Error("Must pass but failed with error " + JSON.stringify(err))));
}

