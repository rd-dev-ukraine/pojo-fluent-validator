"use strict";
var ErrorAccumulator = (function () {
    function ErrorAccumulator() {
        this.errorHash = {};
        this.isValid = true;
    }
    ErrorAccumulator.prototype.report = function (path, errorMessage) {
        this.isValid = false;
        if (!errorMessage) {
            return;
        }
        var messages = this.errorHash[path] = (this.errorHash[path] || []);
        if (!messages.some(function (v) { return v === errorMessage; })) {
            messages.push(errorMessage);
        }
    };
    ErrorAccumulator.prototype.errors = function () {
        return this.errorHash;
    };
    ErrorAccumulator.prototype.valid = function () {
        return this.isValid;
    };
    return ErrorAccumulator;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ErrorAccumulator;
