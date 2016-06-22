import { ValidationErrorHash } from "./definitions";

export default class ErrorAccumulator {
    private errorHash: ValidationErrorHash = {};
    private isValid = true;

    report(path: string, errorMessage: string): void {
        this.isValid = false;

        if (!errorMessage) {
            return;
        }

        const messages = this.errorHash[path] = (this.errorHash[path] || []);
        messages.push(errorMessage);
    }

    errors(): ValidationErrorHash {
        return this.errorHash;
    }

    valid() {
        return this.isValid;
    }
}
