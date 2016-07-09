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
const mode_1 = require('./mode');
class Remapper {
    constructor(configKey, insertModeRemapping = false) {
        this._mostRecentKeys = [];
        this._remappings = [];
        this._isInsertModeRemapping = false;
        this._isInsertModeRemapping = insertModeRemapping;
        this._remappings = vscode.workspace.getConfiguration('vim')
            .get(configKey, []);
    }
    _longestKeySequence() {
        if (this._remappings.length > 0) {
            return _.maxBy(this._remappings, map => map.before.length).before.length;
        }
        else {
            return 1;
        }
    }
    sendKey(key, modeHandler, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if ((vimState.currentMode === mode_1.ModeName.Insert && !this._isInsertModeRemapping) ||
                (vimState.currentMode !== mode_1.ModeName.Insert && this._isInsertModeRemapping)) {
                this._reset();
                return false;
            }
            const longestKeySequence = this._longestKeySequence();
            this._mostRecentKeys.push(key);
            this._mostRecentKeys = this._mostRecentKeys.slice(-longestKeySequence);
            for (let sliceLength = 1; sliceLength <= longestKeySequence; sliceLength++) {
                const slice = this._mostRecentKeys.slice(-sliceLength);
                const remapping = _.find(this._remappings, map => map.before.join("") === slice.join(""));
                if (remapping) {
                    if (this._isInsertModeRemapping) {
                        vimState.historyTracker.undoAndRemoveChanges(this._mostRecentKeys.length);
                    }
                    yield modeHandler.handleMultipleKeyEvents(remapping.after);
                    this._mostRecentKeys = [];
                    return true;
                }
            }
            return false;
        });
    }
    _reset() {
        this._mostRecentKeys = [];
    }
}
class InsertModeRemapper extends Remapper {
    constructor() {
        super("insertModeKeyBindings", true);
    }
}
exports.InsertModeRemapper = InsertModeRemapper;
class OtherModesRemapper extends Remapper {
    constructor() {
        super("otherModesKeyBindings", false);
    }
}
exports.OtherModesRemapper = OtherModesRemapper;
//# sourceMappingURL=remapper.js.map