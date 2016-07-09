"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require('vscode');
const _ = require('lodash');
class InsertModeRemapper {
    constructor() {
        this._mostRecentKeys = [];
        this._remappings = [{
                before: ["j", "j"],
                after: ["<esc>"]
            }];
        this._remappings = vscode.workspace.getConfiguration('vim')
            .get("insertModeKeyBindings", []);
    }
    _longestKeySequence() {
        const keys = Object.keys(this._remappings);
        if (keys.length > 0) {
            return _.maxBy(this._remappings, map => map.before.length).before.length;
        }
        else {
            return 1;
        }
    }
    sendKey(key, modeHandler, historyTracker) {
        return __awaiter(this, void 0, Promise, function* () {
            this._mostRecentKeys.push(key);
            this._mostRecentKeys = this._mostRecentKeys.slice(-this._longestKeySequence());
            const remapping = _.find(this._remappings, map => map.before.join("") === this._mostRecentKeys.join(""));
            if (remapping) {
                historyTracker.undoAndRemoveChanges(this._mostRecentKeys.length);
                yield modeHandler.handleMultipleKeyEvents(remapping.after);
                this._mostRecentKeys = [];
            }
            return !!remapping;
        });
    }
    reset() {
        this._mostRecentKeys = [];
    }
}
exports.InsertModeRemapper = InsertModeRemapper;
//# sourceMappingURL=insertModeRemapper.js.map