"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const node = require("../node");
const configuration_1 = require("./../../configuration/configuration");
class NohlCommand extends node.CommandBase {
    constructor(args) {
        super();
        this._name = 'nohl';
        this._arguments = args;
    }
    get arguments() {
        return this._arguments;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            configuration_1.Configuration.hl = false;
        });
    }
}
exports.NohlCommand = NohlCommand;
//# sourceMappingURL=nohl.js.map