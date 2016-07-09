"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const modeHandler_1 = require('./../mode/modeHandler');
const mode_1 = require('./../mode/mode');
const textEditor_1 = require('./../textEditor');
const register_1 = require('./../register/register');
const position_1 = require('./../motion/position');
const vscode = require('vscode');
const controlKeys = [
    "ctrl",
    "alt",
    "shift",
    "esc",
    "delete",
    "left",
    "right",
    "up",
    "down"
];
const compareKeypressSequence = function (one, two) {
    const containsControlKey = (s) => {
        for (const controlKey of controlKeys) {
            if (s.indexOf(controlKey) !== -1) {
                return true;
            }
        }
        return false;
    };
    const isSingleNumber = (s) => {
        return s.length === 1 && "1234567890".indexOf(s) > -1;
    };
    if (one.length !== two.length) {
        return false;
    }
    for (let i = 0, j = 0; i < one.length; i++, j++) {
        const left = one[i], right = two[j];
        if (left === "<any>") {
            continue;
        }
        if (right === "<any>") {
            continue;
        }
        if (left === "<number>" && isSingleNumber(right)) {
            continue;
        }
        if (right === "<number>" && isSingleNumber(left)) {
            continue;
        }
        if (left === "<character>" && !containsControlKey(right)) {
            continue;
        }
        if (right === "<character>" && !containsControlKey(left)) {
            continue;
        }
        if (left !== right) {
            return false;
        }
    }
    return true;
};
function isIMovement(o) {
    return o.start !== undefined &&
        o.stop !== undefined;
}
exports.isIMovement = isIMovement;
class BaseAction {
    constructor() {
        /**
         * Can this action be paired with an operator (is it like w in dw)? All
         * BaseMovements can be, and some more sophisticated commands also can be.
         */
        this.isMotion = false;
        this.canBeRepeatedWithDot = false;
        this.mustBeFirstKey = false;
        /**
         * The keys pressed at the time that this action was triggered.
         */
        this.keysPressed = [];
    }
    /**
     * Is this action valid in the current Vim state?
     */
    doesActionApply(vimState, keysPressed) {
        if (this.modes.indexOf(vimState.currentMode) === -1) {
            return false;
        }
        if (!compareKeypressSequence(this.keys, keysPressed)) {
            return false;
        }
        if (vimState.recordedState.actionsRun.length > 0 &&
            this.mustBeFirstKey) {
            return false;
        }
        if (this instanceof BaseOperator && vimState.recordedState.operator) {
            return false;
        }
        return true;
    }
    /**
     * Could the user be in the process of doing this action.
     */
    couldActionApply(vimState, keysPressed) {
        if (this.modes.indexOf(vimState.currentMode) === -1) {
            return false;
        }
        if (!compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) {
            return false;
        }
        if (vimState.recordedState.actionsRun.length > 0 &&
            this.mustBeFirstKey) {
            return false;
        }
        if (this instanceof BaseOperator && vimState.recordedState.operator) {
            return false;
        }
        return true;
    }
    toString() {
        return this.keys.join("");
    }
}
exports.BaseAction = BaseAction;
/**
 * A movement is something like 'h', 'k', 'w', 'b', 'gg', etc.
 */
class BaseMovement extends BaseAction {
    constructor(...args) {
        super(...args);
        this.isMotion = true;
        this.canBePrefixedWithCount = false;
        /**
         * Whether we should change desiredColumn in VimState.
         */
        this.doesntChangeDesiredColumn = false;
        /**
         * This is for commands like $ which force the desired column to be at
         * the end of even the longest line.
         */
        this.setsDesiredColumnToEOL = false;
    }
    /**
     * Run the movement a single time.
     *
     * Generally returns a new Position. If necessary, it can return an IMovement instead.
     */
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            throw new Error("Not implemented!");
        });
    }
    /**
     * Run the movement in an operator context a single time.
     *
     * Some movements operate over different ranges when used for operators.
     */
    execActionForOperator(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield this.execAction(position, vimState);
        });
    }
    /**
     * Run a movement count times.
     *
     * count: the number prefix the user entered, or 0 if they didn't enter one.
     */
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            let recordedState = vimState.recordedState;
            let result;
            if (count < 1) {
                count = 1;
            }
            else if (count > 99999) {
                count = 99999;
            }
            for (let i = 0; i < count; i++) {
                const lastIteration = (i === count - 1);
                const temporaryResult = (recordedState.operator && lastIteration) ?
                    yield this.execActionForOperator(position, vimState) :
                    yield this.execAction(position, vimState);
                result = temporaryResult;
                if (result instanceof position_1.Position) {
                    position = result;
                }
                else if (isIMovement(result)) {
                    position = result.stop;
                }
            }
            return result;
        });
    }
}
exports.BaseMovement = BaseMovement;
/**
 * A command is something like <esc>, :, v, i, etc.
 */
class BaseCommand extends BaseAction {
    constructor(...args) {
        super(...args);
        /**
         * If isCompleteAction is true, then triggering this command is a complete action -
         * that means that we'll go and try to run it.
         */
        this.isCompleteAction = true;
        this.canBePrefixedWithCount = false;
        this.canBeRepeatedWithDot = false;
    }
    /**
     * Run the command a single time.
     */
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            throw new Error("Not implemented!");
        });
    }
    /**
     * Run the command the number of times VimState wants us to.
     */
    execCount(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            let timesToRepeat = this.canBePrefixedWithCount ? vimState.recordedState.count || 1 : 1;
            for (let i = 0; i < timesToRepeat; i++) {
                vimState = yield this.exec(position, vimState);
            }
            return vimState;
        });
    }
}
exports.BaseCommand = BaseCommand;
class BaseOperator extends BaseAction {
    constructor(...args) {
        super(...args);
        this.canBeRepeatedWithDot = true;
    }
    /**
     * Run this operator on a range, returning the new location of the cursor.
     */
    run(vimState, start, stop) { return; }
}
exports.BaseOperator = BaseOperator;
(function (KeypressState) {
    KeypressState[KeypressState["WaitingOnKeys"] = 0] = "WaitingOnKeys";
    KeypressState[KeypressState["NoPossibleMatch"] = 1] = "NoPossibleMatch";
})(exports.KeypressState || (exports.KeypressState = {}));
var KeypressState = exports.KeypressState;
class Actions {
    /**
     * Gets the action that should be triggered given a key
     * sequence.
     *
     * If there is a definitive action that matched, returns that action.
     *
     * If an action could potentially match if more keys were to be pressed, returns true. (e.g.
     * you pressed "g" and are about to press "g" action to make the full action "gg".)
     *
     * If no action could ever match, returns false.
     */
    static getRelevantAction(keysPressed, vimState) {
        let couldPotentiallyHaveMatch = false;
        for (const { type, action } of Actions.allActions) {
            if (action.doesActionApply(vimState, keysPressed)) {
                const result = new type();
                result.keysPressed = vimState.recordedState.actionKeys.slice(0);
                return result;
            }
            if (action.couldActionApply(vimState, keysPressed)) {
                couldPotentiallyHaveMatch = true;
            }
        }
        return couldPotentiallyHaveMatch ? KeypressState.WaitingOnKeys : KeypressState.NoPossibleMatch;
    }
}
/**
 * Every Vim action will be added here with the @RegisterAction decorator.
 */
Actions.allActions = [];
exports.Actions = Actions;
function RegisterAction(action) {
    Actions.allActions.push({ type: action, action: new action() });
}
exports.RegisterAction = RegisterAction;
// begin actions
let CommandNumber = class CommandNumber extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<number>"];
        this.isCompleteAction = false;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const number = parseInt(this.keysPressed[0], 10);
            vimState.recordedState.count = vimState.recordedState.count * 10 + number;
            return vimState;
        });
    }
    doesActionApply(vimState, keysPressed) {
        const isZero = keysPressed[0] === "0";
        return super.doesActionApply(vimState, keysPressed) &&
            ((isZero && vimState.recordedState.count > 0) || !isZero);
    }
    couldActionApply(vimState, keysPressed) {
        const isZero = keysPressed[0] === "0";
        return super.couldActionApply(vimState, keysPressed) &&
            ((isZero && vimState.recordedState.count > 0) || !isZero);
    }
};
CommandNumber = __decorate([
    RegisterAction
], CommandNumber);
let CommandEsc = class CommandEsc extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<esc>"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (vimState.currentMode !== mode_1.ModeName.Visual &&
                vimState.currentMode !== mode_1.ModeName.VisualLine) {
                vimState.cursorPosition = position.getLeft();
            }
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommandEsc = __decorate([
    RegisterAction
], CommandEsc);
let CommandInsertAtCursor = class CommandInsertAtCursor extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["i"];
        this.mustBeFirstKey = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Insert;
            return vimState;
        });
    }
};
CommandInsertAtCursor = __decorate([
    RegisterAction
], CommandInsertAtCursor);
let CommandInsertInSearchMode = class CommandInsertInSearchMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.SearchInProgressMode];
        this.keys = ["<any>"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const key = this.keysPressed[0];
            const searchState = vimState.searchState;
            // handle special keys first
            if (key === "<backspace>") {
                searchState.searchString = searchState.searchString.slice(0, -1);
            }
            else if (key === "\n") {
                vimState.currentMode = mode_1.ModeName.Normal;
                vimState.cursorPosition = vimState.searchState.getNextSearchMatchPosition(searchState.searchCursorStartPosition).pos;
                return vimState;
            }
            else if (key === "<esc>") {
                vimState.currentMode = mode_1.ModeName.Normal;
                vimState.searchState = undefined;
                return vimState;
            }
            else {
                searchState.searchString += this.keysPressed[0];
            }
            // console.log(vimState.searchString); (TODO: Show somewhere!)
            vimState.cursorPosition = searchState.getNextSearchMatchPosition(searchState.searchCursorStartPosition).pos;
            return vimState;
        });
    }
};
CommandInsertInSearchMode = __decorate([
    RegisterAction
], CommandInsertInSearchMode);
let CommandNextSearchMatch = class CommandNextSearchMatch extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["n"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const searchState = vimState.searchState;
            if (searchState.searchString === "") {
                return position;
            }
            return vimState.searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;
        });
    }
};
CommandNextSearchMatch = __decorate([
    RegisterAction
], CommandNextSearchMatch);
let CommandStar_1;
let CommandStar = CommandStar_1 = class CommandStar extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["*"];
        this.isMotion = true;
        this.canBePrefixedWithCount = true;
    }
    static GetWordAtPosition(position) {
        const start = position.getWordLeft(true);
        const end = position.getCurrentWordEnd(true).getRight();
        return textEditor_1.TextEditor.getText(new vscode.Range(start, end));
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const currentWord = CommandStar_1.GetWordAtPosition(position);
            vimState.searchState = new modeHandler_1.SearchState(+1, vimState.cursorPosition, currentWord);
            do {
                vimState.cursorPosition = vimState.searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;
            } while (CommandStar_1.GetWordAtPosition(vimState.cursorPosition) !== currentWord);
            return vimState;
        });
    }
};
CommandStar = CommandStar_1 = __decorate([
    RegisterAction
], CommandStar);
let CommandHash = class CommandHash extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["#"];
        this.isMotion = true;
        this.canBePrefixedWithCount = true;
    }
    static GetWordAtPosition(position) {
        const start = position.getWordLeft(true);
        const end = position.getCurrentWordEnd(true).getRight();
        return textEditor_1.TextEditor.getText(new vscode.Range(start, end));
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const currentWord = CommandStar.GetWordAtPosition(position);
            vimState.searchState = new modeHandler_1.SearchState(-1, vimState.cursorPosition, currentWord);
            do {
                vimState.cursorPosition = vimState.searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;
            } while (CommandStar.GetWordAtPosition(vimState.cursorPosition) !== currentWord);
            return vimState;
        });
    }
};
CommandHash = __decorate([
    RegisterAction
], CommandHash);
let CommandPreviousSearchMatch = class CommandPreviousSearchMatch extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["N"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const searchState = vimState.searchState;
            if (searchState.searchString === "") {
                return position;
            }
            return searchState.getNextSearchMatchPosition(vimState.cursorPosition, -1).pos;
        });
    }
};
CommandPreviousSearchMatch = __decorate([
    RegisterAction
], CommandPreviousSearchMatch);
let CommandInsertInInsertMode = class CommandInsertInInsertMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert];
        this.keys = ["<character>"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const char = this.keysPressed[this.keysPressed.length - 1];
            if (char === "<backspace>") {
                if (position.character === 0) {
                    if (position.line > 0) {
                        yield textEditor_1.TextEditor.delete(new vscode.Range(position.getPreviousLineBegin().getLineEnd(), position.getLineBegin()));
                    }
                }
                else {
                    yield textEditor_1.TextEditor.delete(new vscode.Range(position, position.getLeft()));
                }
            }
            else {
                yield textEditor_1.TextEditor.insert(char, vimState.cursorPosition);
            }
            vimState.cursorStartPosition = position_1.Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
            vimState.cursorPosition = position_1.Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
            return vimState;
        });
    }
    toString() {
        return this.keysPressed[this.keysPressed.length - 1];
    }
};
CommandInsertInInsertMode = __decorate([
    RegisterAction
], CommandInsertInInsertMode);
let CommandSearchForwards = class CommandSearchForwards extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["/"];
        this.isMotion = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.searchState = new modeHandler_1.SearchState(+1, vimState.cursorPosition);
            vimState.currentMode = mode_1.ModeName.SearchInProgressMode;
            return vimState;
        });
    }
};
CommandSearchForwards = __decorate([
    RegisterAction
], CommandSearchForwards);
exports.CommandSearchForwards = CommandSearchForwards;
let CommandSearchBackwards = class CommandSearchBackwards extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["?"];
        this.isMotion = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.searchState = new modeHandler_1.SearchState(-1, vimState.cursorPosition);
            vimState.currentMode = mode_1.ModeName.SearchInProgressMode;
            return vimState;
        });
    }
};
CommandSearchBackwards = __decorate([
    RegisterAction
], CommandSearchBackwards);
exports.CommandSearchBackwards = CommandSearchBackwards;
let CommandFormatCode = class CommandFormatCode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["="];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.action.format");
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommandFormatCode = __decorate([
    RegisterAction
], CommandFormatCode);
let DeleteOperator = class DeleteOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["d"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    /**
     * Deletes from the position of start to 1 past the position of end.
     */
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            end = new position_1.Position(end.line, end.character + 1);
            const isOnLastLine = end.line === textEditor_1.TextEditor.getLineCount() - 1;
            // Vim does this weird thing where it allows you to select and delete
            // the newline character, which it places 1 past the last character
            // in the line. Here we interpret a character position 1 past the end
            // as selecting the newline character.
            if (end.character === textEditor_1.TextEditor.getLineAt(end).text.length + 1) {
                end = end.getDown(0);
            }
            // If we delete linewise to the final line of the document, we expect the line
            // to be removed. This is actually a special case because the newline
            // character we've selected to delete is the newline on the end of the document,
            // but we actually delete the newline on the second to last line.
            // Just writing about this is making me more confused. -_-
            if (isOnLastLine &&
                start.line !== 0 &&
                vimState.effectiveRegisterMode() === register_1.RegisterMode.LineWise) {
                start = start.getPreviousLineBegin().getLineEnd();
            }
            let text = vscode.window.activeTextEditor.document.getText(new vscode.Range(start, end));
            if (vimState.effectiveRegisterMode() === register_1.RegisterMode.LineWise) {
                text = text.slice(0, -1); // slice final newline in linewise mode - linewise put will add it back.
            }
            register_1.Register.put(text, vimState);
            yield textEditor_1.TextEditor.delete(new vscode.Range(start, end));
            if (vimState.currentMode === mode_1.ModeName.Visual) {
                vimState.cursorPosition = position_1.Position.EarlierOf(start, end);
            }
            if (start.character >= textEditor_1.TextEditor.getLineAt(start).text.length) {
                vimState.cursorPosition = start.getLeft();
            }
            else {
                vimState.cursorPosition = start;
            }
            if (vimState.effectiveRegisterMode() === register_1.RegisterMode.LineWise) {
                vimState.cursorPosition = vimState.cursorPosition.getLineBegin();
            }
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
DeleteOperator = __decorate([
    RegisterAction
], DeleteOperator);
exports.DeleteOperator = DeleteOperator;
let DeleteOperatorVisual = class DeleteOperatorVisual extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["D"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield new DeleteOperator().run(vimState, start, end);
        });
    }
};
DeleteOperatorVisual = __decorate([
    RegisterAction
], DeleteOperatorVisual);
exports.DeleteOperatorVisual = DeleteOperatorVisual;
let YankOperator = class YankOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["y"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.canBeRepeatedWithDot = false;
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            if (start.compareTo(end) <= 0) {
                end = new position_1.Position(end.line, end.character + 1);
            }
            else {
                const tmp = start;
                start = end;
                end = tmp;
                end = new position_1.Position(end.line, end.character + 1);
            }
            let text = textEditor_1.TextEditor.getText(new vscode.Range(start, end));
            // If we selected the newline character, add it as well.
            if (vimState.currentMode === mode_1.ModeName.Visual &&
                end.character === textEditor_1.TextEditor.getLineAt(end).text.length + 1) {
                text = text + "\n";
            }
            register_1.Register.put(text, vimState);
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start;
            return vimState;
        });
    }
};
YankOperator = __decorate([
    RegisterAction
], YankOperator);
exports.YankOperator = YankOperator;
let DeleteOperatorXVisual = class DeleteOperatorXVisual extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["x"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield new DeleteOperator().run(vimState, start, end);
        });
    }
};
DeleteOperatorXVisual = __decorate([
    RegisterAction
], DeleteOperatorXVisual);
exports.DeleteOperatorXVisual = DeleteOperatorXVisual;
let UpperCaseOperator = class UpperCaseOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["U"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            const range = new vscode.Range(start, new position_1.Position(end.line, end.character + 1));
            let text = vscode.window.activeTextEditor.document.getText(range);
            yield textEditor_1.TextEditor.replace(range, text.toUpperCase());
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start;
            return vimState;
        });
    }
};
UpperCaseOperator = __decorate([
    RegisterAction
], UpperCaseOperator);
exports.UpperCaseOperator = UpperCaseOperator;
let LowerCaseOperator = class LowerCaseOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["u"];
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            const range = new vscode.Range(start, new position_1.Position(end.line, end.character + 1));
            let text = vscode.window.activeTextEditor.document.getText(range);
            yield textEditor_1.TextEditor.replace(range, text.toLowerCase());
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start;
            return vimState;
        });
    }
};
LowerCaseOperator = __decorate([
    RegisterAction
], LowerCaseOperator);
exports.LowerCaseOperator = LowerCaseOperator;
let MarkCommand = class MarkCommand extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.keys = ["m", "<character>"];
        this.modes = [mode_1.ModeName.Normal];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const markName = this.keysPressed[1];
            vimState.historyTracker.addMark(position, markName);
            return vimState;
        });
    }
};
MarkCommand = __decorate([
    RegisterAction
], MarkCommand);
exports.MarkCommand = MarkCommand;
let MarkMovementBOL = class MarkMovementBOL extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["'", "<character>"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const markName = this.keysPressed[1];
            const mark = vimState.historyTracker.getMark(markName);
            return mark.position.getFirstLineNonBlankChar();
        });
    }
};
MarkMovementBOL = __decorate([
    RegisterAction
], MarkMovementBOL);
exports.MarkMovementBOL = MarkMovementBOL;
let MarkMovement = class MarkMovement extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["`", "<character>"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const markName = this.keysPressed[1];
            const mark = vimState.historyTracker.getMark(markName);
            return mark.position;
        });
    }
};
MarkMovement = __decorate([
    RegisterAction
], MarkMovement);
exports.MarkMovement = MarkMovement;
let ChangeOperator = class ChangeOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.keys = ["c"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            const isEndOfLine = end.character === textEditor_1.TextEditor.getLineAt(end).text.length - 1;
            const state = yield new DeleteOperator().run(vimState, start, end);
            state.currentMode = mode_1.ModeName.Insert;
            // If we delete to EOL, the block cursor would end on the final character,
            // which means the insert cursor would be one to the left of the end of
            // the line.
            if (isEndOfLine) {
                state.cursorPosition = state.cursorPosition.getRight();
            }
            return state;
        });
    }
};
ChangeOperator = __decorate([
    RegisterAction
], ChangeOperator);
exports.ChangeOperator = ChangeOperator;
let PutCommand = class PutCommand extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.keys = ["p"];
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.canBePrefixedWithCount = true;
        this.canBeRepeatedWithDot = true;
    }
    exec(position, vimState, before = false) {
        return __awaiter(this, void 0, Promise, function* () {
            const register = register_1.Register.get(vimState);
            const text = register.text;
            const dest = before ? position : position.getRight();
            if (register.registerMode === register_1.RegisterMode.CharacterWise) {
                yield textEditor_1.TextEditor.insertAt(text, dest);
            }
            else {
                if (before) {
                    yield textEditor_1.TextEditor.insertAt(text + "\n", dest.getLineBegin());
                }
                else {
                    yield textEditor_1.TextEditor.insertAt("\n" + text, dest.getLineEnd());
                }
            }
            // More vim weirdness: If the thing you're pasting has a newline, the cursor
            // stays in the same place. Otherwise, it moves to the end of what you pasted.
            if (register.registerMode === register_1.RegisterMode.LineWise) {
                vimState.cursorPosition = new position_1.Position(dest.line + 1, 0);
            }
            else {
                if (text.indexOf("\n") === -1) {
                    vimState.cursorPosition = new position_1.Position(dest.line, Math.max(dest.character + text.length - 1, 0));
                }
                else {
                    vimState.cursorPosition = dest;
                }
            }
            vimState.currentRegisterMode = register.registerMode;
            return vimState;
        });
    }
    execCount(position, vimState) {
        const _super = name => super[name];
        return __awaiter(this, void 0, Promise, function* () {
            const result = yield _super("execCount").call(this, position, vimState);
            if (vimState.effectiveRegisterMode() === register_1.RegisterMode.LineWise) {
                result.cursorPosition = new position_1.Position(position.line + 1, 0);
            }
            return result;
        });
    }
};
PutCommand = __decorate([
    RegisterAction
], PutCommand);
exports.PutCommand = PutCommand;
let IndentOperator = class IndentOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = [">"];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            vscode.window.activeTextEditor.selection = new vscode.Selection(start, end);
            yield vscode.commands.executeCommand("editor.action.indentLines");
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = start.getFirstLineNonBlankChar();
            return vimState;
        });
    }
};
IndentOperator = __decorate([
    RegisterAction
], IndentOperator);
let OutdentOperator = class OutdentOperator extends BaseOperator {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<"];
    }
    run(vimState, start, end) {
        return __awaiter(this, void 0, Promise, function* () {
            vscode.window.activeTextEditor.selection = new vscode.Selection(start, end);
            yield vscode.commands.executeCommand("editor.action.outdentLines");
            vimState.currentMode = mode_1.ModeName.Normal;
            vimState.cursorPosition = vimState.cursorStartPosition;
            return vimState;
        });
    }
};
OutdentOperator = __decorate([
    RegisterAction
], OutdentOperator);
let PutBeforeCommand = class PutBeforeCommand extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.keys = ["P"];
        this.modes = [mode_1.ModeName.Normal];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const result = yield new PutCommand().exec(position, vimState, true);
            if (vimState.effectiveRegisterMode() === register_1.RegisterMode.LineWise) {
                result.cursorPosition = result.cursorPosition.getPreviousLineBegin();
            }
            return result;
        });
    }
};
PutBeforeCommand = __decorate([
    RegisterAction
], PutBeforeCommand);
exports.PutBeforeCommand = PutBeforeCommand;
let CommandShowCommandLine = class CommandShowCommandLine extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = [":"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.commandAction = modeHandler_1.VimSpecialCommands.ShowCommandLine;
            return vimState;
        });
    }
};
CommandShowCommandLine = __decorate([
    RegisterAction
], CommandShowCommandLine);
let CommandDot = class CommandDot extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["."];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.commandAction = modeHandler_1.VimSpecialCommands.Dot;
            return vimState;
        });
    }
};
CommandDot = __decorate([
    RegisterAction
], CommandDot);
let CommandFold = class CommandFold extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["z", "c"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.fold");
            return vimState;
        });
    }
};
CommandFold = __decorate([
    RegisterAction
], CommandFold);
let CommandCenterScroll = class CommandCenterScroll extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["z", "z"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition), vscode.TextEditorRevealType.InCenter);
            return vimState;
        });
    }
};
CommandCenterScroll = __decorate([
    RegisterAction
], CommandCenterScroll);
let CommandUnfold = class CommandUnfold extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["z", "o"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.unfold");
            return vimState;
        });
    }
};
CommandUnfold = __decorate([
    RegisterAction
], CommandUnfold);
let CommandFoldAll = class CommandFoldAll extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["z", "C"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.foldAll");
            return vimState;
        });
    }
};
CommandFoldAll = __decorate([
    RegisterAction
], CommandFoldAll);
let CommandUnfoldAll = class CommandUnfoldAll extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["z", "O"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.unfoldAll");
            return vimState;
        });
    }
};
CommandUnfoldAll = __decorate([
    RegisterAction
], CommandUnfoldAll);
let CommandUndo = class CommandUndo extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["u"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const newPosition = yield vimState.historyTracker.goBackHistoryStep();
            if (newPosition !== undefined) {
                vimState.cursorPosition = newPosition;
            }
            vimState.alteredHistory = true;
            return vimState;
        });
    }
};
CommandUndo = __decorate([
    RegisterAction
], CommandUndo);
let CommandRedo = class CommandRedo extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["ctrl+r"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const newPosition = yield vimState.historyTracker.goForwardHistoryStep();
            if (newPosition !== undefined) {
                vimState.cursorPosition = newPosition;
            }
            vimState.alteredHistory = true;
            return vimState;
        });
    }
};
CommandRedo = __decorate([
    RegisterAction
], CommandRedo);
let CommandMoveFullPageDown = class CommandMoveFullPageDown extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["ctrl+f"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("cursorPageUp");
            return vimState;
        });
    }
};
CommandMoveFullPageDown = __decorate([
    RegisterAction
], CommandMoveFullPageDown);
let CommandMoveFullPageUp = class CommandMoveFullPageUp extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["ctrl+b"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("cursorPageDown");
            return vimState;
        });
    }
};
CommandMoveFullPageUp = __decorate([
    RegisterAction
], CommandMoveFullPageUp);
let CommandDeleteToLineEnd = class CommandDeleteToLineEnd extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["D"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield new DeleteOperator().run(vimState, position, position.getLineEnd().getLeft());
        });
    }
};
CommandDeleteToLineEnd = __decorate([
    RegisterAction
], CommandDeleteToLineEnd);
let CommandChangeToLineEnd = class CommandChangeToLineEnd extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["C"];
        this.canBePrefixedWithCount = true;
    }
    execCount(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            let count = this.canBePrefixedWithCount ? vimState.recordedState.count || 1 : 1;
            return new ChangeOperator().run(vimState, position, position.getDownByCount(Math.max(0, count - 1)).getLineEnd().getLeft());
        });
    }
};
CommandChangeToLineEnd = __decorate([
    RegisterAction
], CommandChangeToLineEnd);
let CommandExitVisualMode = class CommandExitVisualMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["v"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommandExitVisualMode = __decorate([
    RegisterAction
], CommandExitVisualMode);
let CommandVisualMode = class CommandVisualMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["v"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Visual;
            return vimState;
        });
    }
};
CommandVisualMode = __decorate([
    RegisterAction
], CommandVisualMode);
let CommandVisualLineMode = class CommandVisualLineMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["V"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.VisualLine;
            return vimState;
        });
    }
};
CommandVisualLineMode = __decorate([
    RegisterAction
], CommandVisualLineMode);
let CommandExitVisualLineMode = class CommandExitVisualLineMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.VisualLine];
        this.keys = ["V"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommandExitVisualLineMode = __decorate([
    RegisterAction
], CommandExitVisualLineMode);
let CommandOpenSquareBracket = class CommandOpenSquareBracket extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<ctrl-[>"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Normal;
            return vimState;
        });
    }
};
CommandOpenSquareBracket = __decorate([
    RegisterAction
], CommandOpenSquareBracket);
// begin insert commands
let CommandInsertAtFirstCharacter = class CommandInsertAtFirstCharacter extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.mustBeFirstKey = true;
        this.keys = ["I"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Insert;
            vimState.cursorPosition = position.getFirstLineNonBlankChar();
            return vimState;
        });
    }
};
CommandInsertAtFirstCharacter = __decorate([
    RegisterAction
], CommandInsertAtFirstCharacter);
let CommandInsertAtLineBegin = class CommandInsertAtLineBegin extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.mustBeFirstKey = true;
        this.keys = ["g", "I"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Insert;
            vimState.cursorPosition = position.getLineBegin();
            return vimState;
        });
    }
};
CommandInsertAtLineBegin = __decorate([
    RegisterAction
], CommandInsertAtLineBegin);
let CommandInsertAfterCursor = class CommandInsertAfterCursor extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.mustBeFirstKey = true;
        this.keys = ["a"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Insert;
            vimState.cursorPosition = position.getRight();
            return vimState;
        });
    }
};
CommandInsertAfterCursor = __decorate([
    RegisterAction
], CommandInsertAfterCursor);
let CommandInsertAtLineEnd = class CommandInsertAtLineEnd extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["A"];
        this.mustBeFirstKey = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.currentMode = mode_1.ModeName.Insert;
            vimState.cursorPosition = position.getLineEnd();
            return vimState;
        });
    }
};
CommandInsertAtLineEnd = __decorate([
    RegisterAction
], CommandInsertAtLineEnd);
let CommandInsertNewLineAbove = class CommandInsertNewLineAbove extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["O"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.action.insertLineBefore");
            vimState.currentMode = mode_1.ModeName.Insert;
            vimState.cursorPosition = new position_1.Position(position.line, textEditor_1.TextEditor.getLineAt(position).text.length);
            return vimState;
        });
    }
};
CommandInsertNewLineAbove = __decorate([
    RegisterAction
], CommandInsertNewLineAbove);
let CommandInsertNewLineBefore = class CommandInsertNewLineBefore extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["o"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            yield vscode.commands.executeCommand("editor.action.insertLineAfter");
            vimState.currentMode = mode_1.ModeName.Insert;
            vimState.cursorPosition = new position_1.Position(position.line + 1, textEditor_1.TextEditor.getLineAt(new position_1.Position(position.line + 1, 0)).text.length);
            return vimState;
        });
    }
};
CommandInsertNewLineBefore = __decorate([
    RegisterAction
], CommandInsertNewLineBefore);
let MoveLeft = class MoveLeft extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["h"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getLeft();
        });
    }
};
MoveLeft = __decorate([
    RegisterAction
], MoveLeft);
let MoveLeftArrow = class MoveLeftArrow extends MoveLeft {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert, mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<left>"];
    }
};
MoveLeftArrow = __decorate([
    RegisterAction
], MoveLeftArrow);
let MoveUp = class MoveUp extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["k"];
        this.doesntChangeDesiredColumn = true;
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getUp(vimState.desiredColumn);
        });
    }
};
MoveUp = __decorate([
    RegisterAction
], MoveUp);
let MoveUpArrow = class MoveUpArrow extends MoveUp {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert, mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<up>"];
    }
};
MoveUpArrow = __decorate([
    RegisterAction
], MoveUpArrow);
let MoveDown = class MoveDown extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["j"];
        this.doesntChangeDesiredColumn = true;
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getDown(vimState.desiredColumn);
        });
    }
};
MoveDown = __decorate([
    RegisterAction
], MoveDown);
let MoveDownArrow = class MoveDownArrow extends MoveDown {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert, mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<down>"];
    }
};
MoveDownArrow = __decorate([
    RegisterAction
], MoveDownArrow);
let MoveRight = class MoveRight extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["l"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return new position_1.Position(position.line, position.character + 1);
        });
    }
};
MoveRight = __decorate([
    RegisterAction
], MoveRight);
let MoveRightArrow = class MoveRightArrow extends MoveRight {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Insert, mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["<right>"];
    }
};
MoveRightArrow = __decorate([
    RegisterAction
], MoveRightArrow);
let MoveRightWithSpace = class MoveRightWithSpace extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = [" "];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getRightThroughLineBreaks();
        });
    }
};
MoveRightWithSpace = __decorate([
    RegisterAction
], MoveRightWithSpace);
let MoveToRightPane = class MoveToRightPane extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["ctrl+w", "l"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.focusChanged = true;
            yield vscode.commands.executeCommand("workbench.action.focusNextGroup");
            return vimState;
        });
    }
};
MoveToRightPane = __decorate([
    RegisterAction
], MoveToRightPane);
let MoveToLeftPane = class MoveToLeftPane extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["ctrl+w", "h"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            vimState.focusChanged = true;
            yield vscode.commands.executeCommand("workbench.action.focusPreviousGroup");
            return vimState;
        });
    }
};
MoveToLeftPane = __decorate([
    RegisterAction
], MoveToLeftPane);
let MoveDownNonBlank = class MoveDownNonBlank extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["+"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getDownByCount(Math.max(count, 1))
                .getFirstLineNonBlankChar();
        });
    }
};
MoveDownNonBlank = __decorate([
    RegisterAction
], MoveDownNonBlank);
let MoveUpNonBlank = class MoveUpNonBlank extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["-"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getUpByCount(Math.max(count, 1))
                .getFirstLineNonBlankChar();
        });
    }
};
MoveUpNonBlank = __decorate([
    RegisterAction
], MoveUpNonBlank);
let MoveUpUnderscore = class MoveUpUnderscore extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["_"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getUpByCount(Math.max(count - 1, 0))
                .getFirstLineNonBlankChar();
        });
    }
};
MoveUpUnderscore = __decorate([
    RegisterAction
], MoveUpUnderscore);
let MoveToColumn = class MoveToColumn extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["|"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return new position_1.Position(position.line, Math.max(0, count - 1));
        });
    }
};
MoveToColumn = __decorate([
    RegisterAction
], MoveToColumn);
let MoveFindForward = class MoveFindForward extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["f", "<character>"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            count = count || 1;
            const toFind = this.keysPressed[1];
            let result = position.findForwards(toFind, count);
            if (vimState.recordedState.operator) {
                result = result.getRight();
            }
            return result;
        });
    }
};
MoveFindForward = __decorate([
    RegisterAction
], MoveFindForward);
let MoveFindBackward = class MoveFindBackward extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["F", "<character>"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            count = count || 1;
            const toFind = this.keysPressed[1];
            let result = position.findBackwards(toFind, count);
            if (vimState.recordedState.operator) {
                result = result.getLeft();
            }
            return result;
        });
    }
};
MoveFindBackward = __decorate([
    RegisterAction
], MoveFindBackward);
let MoveTilForward = class MoveTilForward extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["t", "<character>"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            count = count || 1;
            const toFind = this.keysPressed[1];
            let result = position.tilForwards(toFind, count);
            if (vimState.recordedState.operator) {
                result = result.getRight();
            }
            return result;
        });
    }
};
MoveTilForward = __decorate([
    RegisterAction
], MoveTilForward);
let MoveTilBackward = class MoveTilBackward extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["T", "<character>"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            count = count || 1;
            const toFind = this.keysPressed[1];
            let result = position.tilBackwards(toFind, count);
            if (vimState.recordedState.operator) {
                result = result.getLeft();
            }
            return result;
        });
    }
};
MoveTilBackward = __decorate([
    RegisterAction
], MoveTilBackward);
let MoveLineEnd = class MoveLineEnd extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["$"];
        this.setsDesiredColumnToEOL = true;
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getLineEnd();
        });
    }
};
MoveLineEnd = __decorate([
    RegisterAction
], MoveLineEnd);
let MoveLineBegin = class MoveLineBegin extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["0"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getLineBegin();
        });
    }
    doesActionApply(vimState, keysPressed) {
        return super.doesActionApply(vimState, keysPressed) &&
            vimState.recordedState.count === 0;
    }
    couldActionApply(vimState, keysPressed) {
        return super.couldActionApply(vimState, keysPressed) &&
            vimState.recordedState.count === 0;
    }
};
MoveLineBegin = __decorate([
    RegisterAction
], MoveLineBegin);
let MoveNonBlank = class MoveNonBlank extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["^"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getFirstLineNonBlankChar();
        });
    }
};
MoveNonBlank = __decorate([
    RegisterAction
], MoveNonBlank);
let MoveNextLineNonBlank = class MoveNextLineNonBlank extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["\n"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getDown(0).getFirstLineNonBlankChar();
        });
    }
};
MoveNextLineNonBlank = __decorate([
    RegisterAction
], MoveNextLineNonBlank);
let MoveNonBlankFirst = class MoveNonBlankFirst extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["g", "g"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            if (count === 0) {
                return position.getDocumentStart();
            }
            return new position_1.Position(count - 1, 0);
        });
    }
};
MoveNonBlankFirst = __decorate([
    RegisterAction
], MoveNonBlankFirst);
let MoveNonBlankLast = class MoveNonBlankLast extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["G"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            if (count === 0) {
                return new position_1.Position(textEditor_1.TextEditor.getLineCount() - 1, 0);
            }
            return new position_1.Position(count - 1, 0);
        });
    }
};
MoveNonBlankLast = __decorate([
    RegisterAction
], MoveNonBlankLast);
let MoveWordBegin = class MoveWordBegin extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["w"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (vimState.recordedState.operator instanceof ChangeOperator) {
                /*
                From the Vim manual:
          
                Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
                on a non-blank.  This is because "cw" is interpreted as change-word, and a
                word does not include the following white space.
                */
                return position.getCurrentWordEnd().getRight();
            }
            else {
                return position.getWordRight();
            }
        });
    }
    execActionForOperator(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const result = yield this.execAction(position, vimState);
            /*
            From the Vim documentation:
        
            Another special case: When using the "w" motion in combination with an
            operator and the last word moved over is at the end of a line, the end of
            that word becomes the end of the operated text, not the first word in the
            next line.
            */
            if (result.isLineBeginning()) {
                return result.getLeftThroughLineBreaks();
            }
            if (result.isLineEnd()) {
                return new position_1.Position(result.line, result.character + 1);
            }
            return result;
        });
    }
};
MoveWordBegin = __decorate([
    RegisterAction
], MoveWordBegin);
exports.MoveWordBegin = MoveWordBegin;
let MoveFullWordBegin = class MoveFullWordBegin extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["W"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (vimState.recordedState.operator instanceof ChangeOperator) {
                // TODO use execForOperator? Or maybe dont?
                // See note for w
                return position.getCurrentBigWordEnd().getRight();
            }
            else {
                return position.getBigWordRight();
            }
        });
    }
};
MoveFullWordBegin = __decorate([
    RegisterAction
], MoveFullWordBegin);
let MoveWordEnd = class MoveWordEnd extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["e"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getCurrentWordEnd();
        });
    }
    execActionForOperator(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            let end = position.getCurrentWordEnd();
            return new position_1.Position(end.line, end.character + 1);
        });
    }
};
MoveWordEnd = __decorate([
    RegisterAction
], MoveWordEnd);
let MoveFullWordEnd = class MoveFullWordEnd extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["E"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getCurrentBigWordEnd();
        });
    }
};
MoveFullWordEnd = __decorate([
    RegisterAction
], MoveFullWordEnd);
let MoveLastWordEnd = class MoveLastWordEnd extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["g", "e"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getLastWordEnd();
        });
    }
};
MoveLastWordEnd = __decorate([
    RegisterAction
], MoveLastWordEnd);
let MoveLastFullWordEnd = class MoveLastFullWordEnd extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["g", "E"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getLastBigWordEnd();
        });
    }
};
MoveLastFullWordEnd = __decorate([
    RegisterAction
], MoveLastFullWordEnd);
let MoveBeginningWord = class MoveBeginningWord extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["b"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getWordLeft();
        });
    }
};
MoveBeginningWord = __decorate([
    RegisterAction
], MoveBeginningWord);
let MoveBeginningFullWord = class MoveBeginningFullWord extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["B"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getBigWordLeft();
        });
    }
};
MoveBeginningFullWord = __decorate([
    RegisterAction
], MoveBeginningFullWord);
let MovePreviousSentenceBegin = class MovePreviousSentenceBegin extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["("];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getPreviousSentenceBegin();
        });
    }
};
MovePreviousSentenceBegin = __decorate([
    RegisterAction
], MovePreviousSentenceBegin);
let MoveNextSentenceBegin = class MoveNextSentenceBegin extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = [")"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getNextSentenceBegin();
        });
    }
};
MoveNextSentenceBegin = __decorate([
    RegisterAction
], MoveNextSentenceBegin);
let MoveParagraphEnd = class MoveParagraphEnd extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["}"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getCurrentParagraphEnd();
        });
    }
};
MoveParagraphEnd = __decorate([
    RegisterAction
], MoveParagraphEnd);
let MoveParagraphBegin = class MoveParagraphBegin extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["{"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return position.getCurrentParagraphBeginning();
        });
    }
};
MoveParagraphBegin = __decorate([
    RegisterAction
], MoveParagraphBegin);
let ActionDeleteChar = class ActionDeleteChar extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["x"];
        this.canBePrefixedWithCount = true;
        this.canBeRepeatedWithDot = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const state = yield new DeleteOperator().run(vimState, position, position);
            state.currentMode = mode_1.ModeName.Normal;
            return state;
        });
    }
};
ActionDeleteChar = __decorate([
    RegisterAction
], ActionDeleteChar);
let ActionDeleteLastChar = class ActionDeleteLastChar extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["X"];
        this.canBeRepeatedWithDot = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (position.character === 0) {
                return vimState;
            }
            return yield new DeleteOperator().run(vimState, position.getLeft(), position.getLeft());
        });
    }
};
ActionDeleteLastChar = __decorate([
    RegisterAction
], ActionDeleteLastChar);
let ActionJoin = class ActionJoin extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["J"];
        this.canBeRepeatedWithDot = true;
        this.canBePrefixedWithCount = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (position.line === textEditor_1.TextEditor.getLineCount() - 1) {
                return vimState; // TODO: bell
            }
            let lineOne = textEditor_1.TextEditor.getLineAt(position).text;
            let lineTwo = textEditor_1.TextEditor.getLineAt(position.getNextLineBegin()).text;
            lineTwo = lineTwo.substring(position.getNextLineBegin().getFirstLineNonBlankChar().character);
            // TODO(whitespace): need a better way to check for whitespace
            let oneEndsWithWhitespace = lineOne.length > 0 && " \t".indexOf(lineOne[lineOne.length - 1]) > -1;
            let isParenthesisPair = (lineOne[lineOne.length - 1] === '(' && lineTwo[0] === ')');
            const addSpace = !oneEndsWithWhitespace && !isParenthesisPair;
            let resultLine = lineOne + (addSpace ? " " : "") + lineTwo;
            let newState = yield new DeleteOperator().run(vimState, position.getLineBegin(), lineTwo.length > 0 ?
                position.getNextLineBegin().getLineEnd().getLeft() :
                position.getLineEnd());
            yield textEditor_1.TextEditor.insert(resultLine, position);
            newState.cursorPosition = new position_1.Position(position.line, lineOne.length + (addSpace ? 1 : 0) + (isParenthesisPair ? 1 : 0) - 1);
            return newState;
        });
    }
};
ActionJoin = __decorate([
    RegisterAction
], ActionJoin);
let ActionJoinNoWhitespace = class ActionJoinNoWhitespace extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["g", "J"];
        this.canBeRepeatedWithDot = true;
        this.canBePrefixedWithCount = true;
    }
    // gJ is essentially J without the edge cases. ;-)
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (position.line === textEditor_1.TextEditor.getLineCount() - 1) {
                return vimState; // TODO: bell
            }
            let lineOne = textEditor_1.TextEditor.getLineAt(position).text;
            let lineTwo = textEditor_1.TextEditor.getLineAt(position.getNextLineBegin()).text;
            lineTwo = lineTwo.substring(position.getNextLineBegin().getFirstLineNonBlankChar().character);
            let resultLine = lineOne + lineTwo;
            let newState = yield new DeleteOperator().run(vimState, position.getLineBegin(), lineTwo.length > 0 ?
                position.getNextLineBegin().getLineEnd().getLeft() :
                position.getLineEnd());
            yield textEditor_1.TextEditor.insert(resultLine, position);
            newState.cursorPosition = new position_1.Position(position.line, lineOne.length);
            return newState;
        });
    }
};
ActionJoinNoWhitespace = __decorate([
    RegisterAction
], ActionJoinNoWhitespace);
let ActionReplaceCharacter = class ActionReplaceCharacter extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["r", "<character>"];
        this.canBeRepeatedWithDot = true;
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const toReplace = this.keysPressed[1];
            const state = yield new DeleteOperator().run(vimState, position, position);
            yield textEditor_1.TextEditor.insertAt(toReplace, position);
            state.cursorPosition = position;
            return state;
        });
    }
};
ActionReplaceCharacter = __decorate([
    RegisterAction
], ActionReplaceCharacter);
// DOUBLE MOTIONS
// (dd yy cc << >>)
// These work because there is a check in does/couldActionApply where
// you can't run an operator if you already have one going (which is logical).
// However there is the slightly weird behavior where dy actually deletes the whole
// line, lol.
let MoveDD = class MoveDD extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["d"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return {
                start: position.getLineBegin(),
                stop: position.getDownByCount(Math.max(0, count - 1)).getLineEnd(),
                registerMode: register_1.RegisterMode.LineWise
            };
        });
    }
};
MoveDD = __decorate([
    RegisterAction
], MoveDD);
let MoveYY = class MoveYY extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["y"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return {
                start: position.getLineBegin(),
                stop: position.getDownByCount(Math.max(0, count - 1)).getLineEnd(),
                registerMode: register_1.RegisterMode.LineWise,
            };
        });
    }
};
MoveYY = __decorate([
    RegisterAction
], MoveYY);
let MoveCC = class MoveCC extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["c"];
    }
    execActionWithCount(position, vimState, count) {
        return __awaiter(this, void 0, Promise, function* () {
            return {
                start: position.getLineBegin(),
                stop: position.getDownByCount(Math.max(0, count - 1)).getLineEnd(),
                registerMode: register_1.RegisterMode.CharacterWise
            };
        });
    }
};
MoveCC = __decorate([
    RegisterAction
], MoveCC);
let MoveIndent = class MoveIndent extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = [">"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return {
                start: position.getLineBegin(),
                stop: position.getLineEnd(),
            };
        });
    }
};
MoveIndent = __decorate([
    RegisterAction
], MoveIndent);
let MoveOutdent = class MoveOutdent extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["<"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return {
                start: position.getLineBegin(),
                stop: position.getLineEnd(),
            };
        });
    }
};
MoveOutdent = __decorate([
    RegisterAction
], MoveOutdent);
let ActionDeleteLineVisualMode = class ActionDeleteLineVisualMode extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["X"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            return yield new DeleteOperator().run(vimState, position.getLineBegin(), position.getLineEnd());
        });
    }
};
ActionDeleteLineVisualMode = __decorate([
    RegisterAction
], ActionDeleteLineVisualMode);
let ActionChangeChar = class ActionChangeChar extends BaseCommand {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["s"];
    }
    exec(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const state = yield new ChangeOperator().run(vimState, position, position);
            state.currentMode = mode_1.ModeName.Insert;
            return state;
        });
    }
};
ActionChangeChar = __decorate([
    RegisterAction
], ActionChangeChar);
let MovementAWordTextObject = class MovementAWordTextObject extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual];
        this.keys = ["a", "w"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (vimState.currentMode === mode_1.ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
                // TODO: This is kind of a bad way to do this, but text objects only work in
                // visual mode if you JUST entered visual mode
                // TODO TODO: I just looked at this again and omg this is awful what was I smoking plz get rid of this asap
                return {
                    start: vimState.cursorStartPosition,
                    stop: yield new MoveWordBegin().execAction(position, vimState),
                };
            }
            const currentChar = textEditor_1.TextEditor.getLineAt(position).text[position.character];
            // TODO(whitespace) - this is a bad way to do this. we need some sort of global
            // white space checking function.
            if (currentChar === ' ' || currentChar === '\t') {
                return {
                    start: position.getLastWordEnd().getRight(),
                    stop: position.getCurrentWordEnd()
                };
            }
            else {
                return {
                    start: position.getWordLeft(true),
                    stop: position.getWordRight().getLeft()
                };
            }
        });
    }
    execActionForOperator(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const line = textEditor_1.TextEditor.getLineAt(position).text;
            const currentChar = line[position.character];
            const res = yield this.execAction(position, vimState);
            const wordEnd = yield new MoveWordBegin().execActionForOperator(position, vimState);
            // TODO(whitespace)
            if (currentChar !== ' ' && currentChar !== '\t') {
                res.stop = wordEnd.getRight();
            }
            else {
                res.stop = wordEnd;
            }
            if (res.stop.character === line.length + 1) {
                res.start = (yield new MoveLastWordEnd().execAction(res.start, vimState)).getRight();
            }
            return res;
        });
    }
};
MovementAWordTextObject = __decorate([
    RegisterAction
], MovementAWordTextObject);
let MovementIWordTextObject = class MovementIWordTextObject extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual];
        this.keys = ["i", "w"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            if (vimState.currentMode === mode_1.ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
                // TODO: This is kind of a bad way to do this, but text objects only work in
                // visual mode if you JUST entered visual mode
                return {
                    start: vimState.cursorStartPosition,
                    stop: yield new MoveWordBegin().execAction(position, vimState),
                };
            }
            const currentChar = textEditor_1.TextEditor.getLineAt(position).text[position.character];
            // TODO(whitespace)  - this is a bad way to do this. we need some sort of global
            // white space checking function.
            if (currentChar === ' ' || currentChar === '\t') {
                return {
                    start: position.getLastWordEnd().getRight(),
                    stop: position.getWordRight().getLeft()
                };
            }
            else {
                return {
                    start: position.getWordLeft(true),
                    stop: position.getCurrentWordEnd(true),
                };
            }
        });
    }
    execActionForOperator(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const res = yield this.execAction(position, vimState);
            res.stop = res.stop.getRight();
            return res;
        });
    }
};
MovementIWordTextObject = __decorate([
    RegisterAction
], MovementIWordTextObject);
let MoveToMatchingBracket = class MoveToMatchingBracket extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal, mode_1.ModeName.Visual, mode_1.ModeName.VisualLine];
        this.keys = ["%"];
        this.pairings = {
            "(": { match: ")", nextMatchIsForward: true },
            "{": { match: "}", nextMatchIsForward: true },
            "[": { match: "]", nextMatchIsForward: true },
            ")": { match: "(", nextMatchIsForward: false },
            "}": { match: "{", nextMatchIsForward: false },
            "]": { match: "[", nextMatchIsForward: false },
        };
    }
    nextBracket(position, charToMatch, toFind, closed = true) {
        /**
         * We do a fairly basic implementation that only tracks the state of the type of
         * character you're over and its pair (e.g. "[" and "]"). This is similar to
         * what Vim does.
         *
         * It can't handle strings very well - something like "|( ')' )" where | is the
         * cursor will cause it to go to the ) in the quotes, even though it should skip over it.
         *
         * PRs welcomed! (TODO)
         * Though ideally VSC implements https://github.com/Microsoft/vscode/issues/7177
         */
        let stackHeight = closed ? 0 : 1;
        let matchedPosition = undefined;
        for (const { char, pos } of position_1.Position.IterateDocument(position, toFind.nextMatchIsForward)) {
            if (char === charToMatch) {
                stackHeight++;
            }
            if (char === this.pairings[charToMatch].match) {
                stackHeight--;
            }
            if (stackHeight === 0) {
                matchedPosition = pos;
                break;
            }
        }
        if (matchedPosition) {
            return matchedPosition;
        }
        // TODO(bell)
        return position;
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const text = textEditor_1.TextEditor.getLineAt(position).text;
            const charToMatch = text[position.character];
            const toFind = this.pairings[charToMatch];
            if (!toFind) {
                // If we're not on a match, go right until we find a
                // pairable character or hit the end of line.
                for (let i = position.character; i < text.length; i++) {
                    if (this.pairings[text[i]]) {
                        return new position_1.Position(position.line, i);
                    }
                }
                // TODO (bell);
                return position;
            }
            return this.nextBracket(position, charToMatch, toFind, true);
        });
    }
    execActionForOperator(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const result = yield this.execAction(position, vimState);
            if (position.compareTo(result) > 0) {
                return result.getLeft();
            }
            else {
                return result.getRight();
            }
        });
    }
};
MoveToMatchingBracket = __decorate([
    RegisterAction
], MoveToMatchingBracket);
let MoveToUnclosedRoundBracketBackward = class MoveToUnclosedRoundBracketBackward extends MoveToMatchingBracket {
    constructor(...args) {
        super(...args);
        this.keys = ["[", "("];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const charToMatch = ")";
            return this.nextBracket(position.getLeftThroughLineBreaks(), charToMatch, this.pairings[charToMatch], false);
        });
    }
};
MoveToUnclosedRoundBracketBackward = __decorate([
    RegisterAction
], MoveToUnclosedRoundBracketBackward);
let MoveToUnclosedRoundBracketForward = class MoveToUnclosedRoundBracketForward extends MoveToMatchingBracket {
    constructor(...args) {
        super(...args);
        this.keys = ["[", ")"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const charToMatch = "(";
            return this.nextBracket(position.getRightThroughLineBreaks(), charToMatch, this.pairings[charToMatch], false);
        });
    }
};
MoveToUnclosedRoundBracketForward = __decorate([
    RegisterAction
], MoveToUnclosedRoundBracketForward);
let MoveToUnclosedCurlyBracketBackward = class MoveToUnclosedCurlyBracketBackward extends MoveToMatchingBracket {
    constructor(...args) {
        super(...args);
        this.keys = ["[", "{"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const charToMatch = "}";
            return this.nextBracket(position.getLeftThroughLineBreaks(), charToMatch, this.pairings[charToMatch], false);
        });
    }
};
MoveToUnclosedCurlyBracketBackward = __decorate([
    RegisterAction
], MoveToUnclosedCurlyBracketBackward);
let MoveToUnclosedCurlyBracketForward = class MoveToUnclosedCurlyBracketForward extends MoveToMatchingBracket {
    constructor(...args) {
        super(...args);
        this.keys = ["[", "}"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const charToMatch = "{";
            return this.nextBracket(position.getRightThroughLineBreaks(), charToMatch, this.pairings[charToMatch], false);
        });
    }
};
MoveToUnclosedCurlyBracketForward = __decorate([
    RegisterAction
], MoveToUnclosedCurlyBracketForward);
let ToggleCaseAndMoveForward = class ToggleCaseAndMoveForward extends BaseMovement {
    constructor(...args) {
        super(...args);
        this.modes = [mode_1.ModeName.Normal];
        this.keys = ["~"];
    }
    execAction(position, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const range = new vscode.Range(position, position.getRight());
            const char = textEditor_1.TextEditor.getText(range);
            // Try lower-case
            let toggled = char.toLocaleLowerCase();
            if (toggled === char) {
                // Try upper-case
                toggled = char.toLocaleUpperCase();
            }
            if (toggled !== char) {
                yield textEditor_1.TextEditor.replace(range, toggled);
            }
            return position.getRight();
        });
    }
};
ToggleCaseAndMoveForward = __decorate([
    RegisterAction
], ToggleCaseAndMoveForward);
//# sourceMappingURL=actions.js.map