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
const extension_1 = require('./../../extension');
const mode_1 = require('./mode');
const remapper_1 = require('./remapper');
const modeNormal_1 = require('./modeNormal');
const modeInsert_1 = require('./modeInsert');
const modeVisual_1 = require('./modeVisual');
const modeSearchInProgress_1 = require('./modeSearchInProgress');
const textEditor_1 = require('./../textEditor');
const modeVisualLine_1 = require('./modeVisualLine');
const historyTracker_1 = require('./../history/historyTracker');
const actions_1 = require('./../actions/actions');
const configuration_1 = require('../configuration/configuration');
const position_1 = require('./../motion/position');
const register_1 = require('./../register/register');
const main_1 = require('../../src/cmd_line/main');
(function (VimSpecialCommands) {
    VimSpecialCommands[VimSpecialCommands["Nothing"] = 0] = "Nothing";
    VimSpecialCommands[VimSpecialCommands["ShowCommandLine"] = 1] = "ShowCommandLine";
    VimSpecialCommands[VimSpecialCommands["Dot"] = 2] = "Dot";
})(exports.VimSpecialCommands || (exports.VimSpecialCommands = {}));
var VimSpecialCommands = exports.VimSpecialCommands;
/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * Actions defined in actions.ts are only allowed to mutate a VimState in order to
 * indicate what they want to do.
 */
class VimState {
    constructor() {
        /**
         * The column the cursor wants to be at, or Number.POSITIVE_INFINITY if it should always
         * be the rightmost column.
         *
         * Example: If you go to the end of a 20 character column, this value
         * will be 20, even if you press j and the next column is only 5 characters.
         * This is because if the third column is 25 characters, the cursor will go
         * back to the 20th column.
         */
        this.desiredColumn = 0;
        /**
         * The keystroke sequence that made up our last complete action (that can be
         * repeated with '.').
         */
        this.previousFullAction = undefined;
        this.alteredHistory = false;
        this.focusChanged = false;
        /**
         * The current full action we are building up.
         */
        this.currentFullAction = [];
        /**
         * The position the cursor will be when this action finishes.
         */
        // public cursorPosition = new Position(0, 0);
        this._cursorPosition = new position_1.Position(0, 0);
        /**
         * The effective starting position of the movement, used along with cursorPosition to determine
         * the range over which to run an Operator. May rarely be different than where the cursor
         * actually starts e.g. if you use the "aw" text motion in the middle of a word.
         */
        this.cursorStartPosition = new position_1.Position(0, 0);
        this.cursorPositionJustBeforeAnythingHappened = new position_1.Position(0, 0);
        this.searchState = undefined;
        /**
         * The mode Vim will be in once this action finishes.
         */
        this.currentMode = mode_1.ModeName.Normal;
        this.currentRegisterMode = register_1.RegisterMode.FigureItOutFromCurrentMode;
        this.registerName = '"';
        /**
         * This is for oddball commands that don't manipulate text in any way.
         */
        this.commandAction = VimSpecialCommands.Nothing;
        this.recordedState = new RecordedState();
        this.settings = new VimSettings();
    }
    get cursorPosition() { return this._cursorPosition; }
    set cursorPosition(v) {
        this._cursorPosition = v;
    }
    effectiveRegisterMode() {
        if (this.currentRegisterMode === register_1.RegisterMode.FigureItOutFromCurrentMode) {
            if (this.currentMode === mode_1.ModeName.VisualLine) {
                return register_1.RegisterMode.LineWise;
            }
            else {
                return register_1.RegisterMode.CharacterWise;
            }
        }
        else {
            return this.currentRegisterMode;
        }
    }
}
exports.VimState = VimState;
class VimSettings {
    constructor() {
        this.useSolidBlockCursor = false;
    }
}
exports.VimSettings = VimSettings;
class SearchState {
    constructor(direction, startPosition, searchString = "") {
        /**
         * Every range in the document that matches the search string.
         */
        this.matchRanges = [];
        this._searchString = "";
        this.searchCursorStartPosition = undefined;
        /**
         * 1  === forward
         * -1 === backward
         */
        this.searchDirection = 1;
        this.searchDirection = direction;
        this.searchCursorStartPosition = startPosition;
        this.searchString = searchString;
    }
    get searchString() {
        return this._searchString;
    }
    set searchString(search) {
        this._searchString = search;
        this._recalculateSearchRanges();
    }
    _recalculateSearchRanges() {
        const search = this.searchString;
        if (search === "") {
            return;
        }
        // Calculate and store all matching ranges
        this.matchRanges = [];
        for (let lineIdx = 0; lineIdx < textEditor_1.TextEditor.getLineCount(); lineIdx++) {
            const line = textEditor_1.TextEditor.getLineAt(new position_1.Position(lineIdx, 0)).text;
            let i = line.indexOf(search);
            for (; i !== -1; i = line.indexOf(search, i + search.length)) {
                this.matchRanges.push(new vscode.Range(new position_1.Position(lineIdx, i), new position_1.Position(lineIdx, i + search.length)));
            }
        }
    }
    /**
     * The position of the next search, or undefined if there is no match.
     *
     * Pass in -1 as direction to reverse the direction we search.
     */
    getNextSearchMatchPosition(startPosition, direction = 1) {
        this._recalculateSearchRanges();
        if (this.matchRanges.length === 0) {
            // TODO(bell)
            return { pos: startPosition, match: false };
        }
        const effectiveDirection = direction * this.searchDirection;
        if (effectiveDirection === 1) {
            for (let matchRange of this.matchRanges) {
                if (matchRange.start.compareTo(startPosition) > 0) {
                    return { pos: position_1.Position.FromVSCodePosition(matchRange.start), match: true };
                }
            }
            // Wrap around
            // TODO(bell)
            return { pos: position_1.Position.FromVSCodePosition(this.matchRanges[0].start), match: true };
        }
        else {
            for (let matchRange of this.matchRanges.slice(0).reverse()) {
                if (matchRange.start.compareTo(startPosition) < 0) {
                    return { pos: position_1.Position.FromVSCodePosition(matchRange.start), match: true };
                }
            }
            // TODO(bell)
            return {
                pos: position_1.Position.FromVSCodePosition(this.matchRanges[this.matchRanges.length - 1].start),
                match: true
            };
        }
    }
}
exports.SearchState = SearchState;
/**
 * The RecordedState class holds the current action that the user is
 * doing. Example: Imagine that the user types:
 *
 * 5"qdw
 *
 * Then the relevent state would be
 *   * count of 5
 *   * copy into q register
 *   * delete operator
 *   * word movement
 *
 *
 * Or imagine the user types:
 *
 * vw$}}d
 *
 * Then the state would be
 *   * Visual mode action
 *   * (a list of all the motions you ran)
 *   * delete operator
 */
class RecordedState {
    constructor() {
        /**
         * Keeps track of keys pressed for the next action. Comes in handy when parsing
         * multiple length movements, e.g. gg.
         */
        this.actionKeys = [];
        this.actionsRun = [];
        this.hasRunOperator = false;
        /**
         * The number of times the user wants to repeat this action.
         */
        this.count = 0;
    }
    /**
     * The operator (e.g. d, y, >) the user wants to run, if there is one.
     */
    get operator() {
        const list = _.filter(this.actionsRun, a => a instanceof actions_1.BaseOperator);
        if (list.length > 1) {
            throw "Too many operators!";
        }
        return list[0];
    }
    get command() {
        const list = _.filter(this.actionsRun, a => a instanceof actions_1.BaseCommand);
        // TODO - disregard <esc>, then assert this is of length 1.
        return list[0];
    }
    get hasRunAMovement() {
        return _.filter(this.actionsRun, a => a.isMotion).length > 0;
    }
    clone() {
        const res = new RecordedState();
        // TODO: Actual clone.
        res.actionKeys = this.actionKeys.slice(0);
        res.actionsRun = this.actionsRun.slice(0);
        res.hasRunOperator = this.hasRunOperator;
        return res;
    }
    operatorReadyToExecute(mode) {
        // Visual modes do not require a motion -- they ARE the motion.
        return this.operator &&
            !this.hasRunOperator &&
            mode !== mode_1.ModeName.SearchInProgressMode &&
            (this.hasRunAMovement || (mode === mode_1.ModeName.Visual ||
                mode === mode_1.ModeName.VisualLine));
    }
    get isInInitialState() {
        return this.operator === undefined &&
            this.actionsRun.length === 0 &&
            this.count === 1;
    }
    toString() {
        let res = "";
        for (const action of this.actionsRun) {
            res += action.toString();
        }
        return res;
    }
}
exports.RecordedState = RecordedState;
class ModeHandler {
    /**
     * isTesting speeds up tests drastically by turning off our checks for
     * mouse events.
     */
    constructor(isTesting = true, filename = "") {
        this._caretDecoration = vscode.window.createTextEditorDecorationType({
            dark: {
                // used for dark colored themes
                backgroundColor: 'rgba(224, 224, 224, 0.4)',
                borderColor: 'rgba(224, 224, 224, 0.4)'
            },
            light: {
                // used for light colored themes
                backgroundColor: 'rgba(32, 32, 32, 0.4)',
                borderColor: 'rgba(32, 32, 32, 0.4)'
            },
            borderStyle: 'solid',
            borderWidth: '1px'
        });
        ModeHandler.IsTesting = isTesting;
        this.filename = filename;
        this._configuration = configuration_1.Configuration.fromUserFile();
        this._vimState = new VimState();
        this._insertModeRemapper = new remapper_1.InsertModeRemapper();
        this._otherModesRemapper = new remapper_1.OtherModesRemapper();
        this._modes = [
            new modeNormal_1.NormalMode(this),
            new modeInsert_1.InsertMode(),
            new modeVisual_1.VisualMode(),
            new modeVisualLine_1.VisualLineMode(),
            new modeSearchInProgress_1.SearchInProgressMode(),
        ];
        this.vimState.historyTracker = new historyTracker_1.HistoryTracker();
        this._vimState.currentMode = mode_1.ModeName.Normal;
        this.setCurrentModeByName(this._vimState);
        // Sometimes, Visual Studio Code will start the cursor in a position which
        // is not (0, 0) - e.g., if you previously edited the file and left the cursor
        // somewhere else when you closed it. This will set our cursor's position to the position
        // that VSC set it to.
        if (vscode.window.activeTextEditor) {
            this._vimState.cursorStartPosition = position_1.Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
            this._vimState.cursorPosition = position_1.Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
        }
        this.loadSettings();
        // Handle scenarios where mouse used to change current position.
        vscode.window.onDidChangeTextEditorSelection((e) => __awaiter(this, void 0, void 0, function* () {
            let selection = e.selections[0];
            if (isTesting) {
                return;
            }
            if (e.textEditor.document.fileName !== this.filename) {
                return;
            }
            if (this._vimState.focusChanged) {
                this._vimState.focusChanged = false;
                return;
            }
            // See comment about whatILastSetTheSelectionTo.
            if (this._vimState.whatILastSetTheSelectionTo.isEqual(selection)) {
                return;
            }
            if (this._vimState.currentMode === mode_1.ModeName.SearchInProgressMode) {
                return;
            }
            if (selection) {
                var newPosition = new position_1.Position(selection.active.line, selection.active.character);
                if (newPosition.character >= newPosition.getLineEnd().character) {
                    newPosition = new position_1.Position(newPosition.line, Math.max(newPosition.getLineEnd().character, 0));
                }
                this._vimState.cursorPosition = newPosition;
                this._vimState.cursorStartPosition = newPosition;
                this._vimState.desiredColumn = newPosition.character;
                // start visual mode?
                if (!selection.anchor.isEqual(selection.active)) {
                    var selectionStart = new position_1.Position(selection.anchor.line, selection.anchor.character);
                    if (selectionStart.character > selectionStart.getLineEnd().character) {
                        selectionStart = new position_1.Position(selectionStart.line, selectionStart.getLineEnd().character);
                    }
                    this._vimState.cursorStartPosition = selectionStart;
                    if (selectionStart.compareTo(newPosition) > 0) {
                        this._vimState.cursorStartPosition = this._vimState.cursorStartPosition.getLeft();
                    }
                    if (this._vimState.currentMode !== mode_1.ModeName.Visual &&
                        this._vimState.currentMode !== mode_1.ModeName.VisualLine) {
                        this._vimState.currentMode = mode_1.ModeName.Visual;
                        this.setCurrentModeByName(this._vimState);
                    }
                }
                else {
                    if (this._vimState.currentMode !== mode_1.ModeName.Insert) {
                        this._vimState.currentMode = mode_1.ModeName.Normal;
                        this.setCurrentModeByName(this._vimState);
                    }
                }
                yield this.updateView(this._vimState, false);
            }
        }));
    }
    get vimState() {
        return this._vimState;
    }
    get currentModeName() {
        return this.currentMode.name;
    }
    loadSettings() {
        this._vimState.settings.useSolidBlockCursor = vscode.workspace.getConfiguration("vim")
            .get("useSolidBlockCursor", false);
    }
    /**
     * The active mode.
     */
    get currentMode() {
        return this._modes.find(mode => mode.isActive);
    }
    setCurrentModeByName(vimState) {
        let activeMode;
        this._vimState.currentMode = vimState.currentMode;
        for (let mode of this._modes) {
            if (mode.name === vimState.currentMode) {
                activeMode = mode;
            }
            mode.isActive = (mode.name === vimState.currentMode);
        }
    }
    handleKeyEvent(key) {
        return __awaiter(this, void 0, Promise, function* () {
            if (key === "<c-r>") {
                key = "ctrl+r";
            } // TODO - temporary hack for tests only!
            // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
            // We'll try to mitigate this problem until it's fixed upstream.
            // https://github.com/Microsoft/vscode/issues/713
            key = this._configuration.keyboardLayout.translate(key);
            this._vimState.cursorPositionJustBeforeAnythingHappened = this._vimState.cursorPosition;
            try {
                let handled = false;
                handled = handled || (yield this._insertModeRemapper.sendKey(key, this, this.vimState));
                handled = handled || (yield this._otherModesRemapper.sendKey(key, this, this.vimState));
                if (!handled) {
                    this._vimState = yield this.handleKeyEventHelper(key, this._vimState);
                }
            }
            catch (e) {
                console.log('error.stack');
                console.log(e);
                console.log(e.stack);
            }
            if (this._vimState.focusChanged) {
                yield extension_1.getAndUpdateModeHandler();
            }
            return true;
        });
    }
    handleKeyEventHelper(key, vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            let recordedState = vimState.recordedState;
            recordedState.actionKeys.push(key);
            vimState.currentFullAction.push(key);
            let result = actions_1.Actions.getRelevantAction(recordedState.actionKeys, vimState);
            if (result === actions_1.KeypressState.NoPossibleMatch) {
                console.log("Nothing matched!");
                vimState.recordedState = new RecordedState();
                return vimState;
            }
            else if (result === actions_1.KeypressState.WaitingOnKeys) {
                return vimState;
            }
            let action = result;
            recordedState.actionsRun.push(action);
            vimState = yield this.runAction(vimState, recordedState, action);
            // Updated desired column
            const movement = action instanceof actions_1.BaseMovement ? action : undefined;
            if ((movement && !movement.doesntChangeDesiredColumn) || recordedState.command) {
                // We check !operator here because e.g. d$ should NOT set the desired column to EOL.
                if (movement && movement.setsDesiredColumnToEOL && !recordedState.operator) {
                    vimState.desiredColumn = Number.POSITIVE_INFINITY;
                }
                else {
                    vimState.desiredColumn = vimState.cursorPosition.character;
                }
            }
            // Update view
            yield this.updateView(vimState);
            return vimState;
        });
    }
    runAction(vimState, recordedState, action) {
        return __awaiter(this, void 0, Promise, function* () {
            let ranRepeatableAction = false;
            let ranAction = false;
            if (action instanceof actions_1.BaseMovement) {
                vimState = yield this.executeMovement(vimState, action);
                ranAction = true;
            }
            if (action instanceof actions_1.BaseCommand) {
                vimState = yield action.execCount(vimState.cursorPosition, vimState);
                if (vimState.commandAction !== VimSpecialCommands.Nothing) {
                    yield this.executeCommand(vimState);
                }
                if (action.isCompleteAction) {
                    ranAction = true;
                }
                if (action.canBeRepeatedWithDot) {
                    ranRepeatableAction = true;
                }
            }
            // Update mode (note the ordering allows you to go into search mode,
            // then return and have the motion immediately applied to an operator).
            if (vimState.currentMode !== this.currentModeName) {
                this.setCurrentModeByName(vimState);
                if (vimState.currentMode === mode_1.ModeName.Normal) {
                    ranRepeatableAction = true;
                }
            }
            if (recordedState.operatorReadyToExecute(vimState.currentMode)) {
                vimState = yield this.executeOperator(vimState);
                vimState.recordedState.hasRunOperator = true;
                ranRepeatableAction = vimState.recordedState.operator.canBeRepeatedWithDot;
                ranAction = true;
            }
            // And then we have to do it again because an operator could
            // have changed it as well. (TODO: do you even decomposition bro)
            if (vimState.currentMode !== this.currentModeName) {
                this.setCurrentModeByName(vimState);
                if (vimState.currentMode === mode_1.ModeName.Normal) {
                    ranRepeatableAction = true;
                }
            }
            ranRepeatableAction = ranRepeatableAction && vimState.currentMode === mode_1.ModeName.Normal;
            ranAction = ranAction && vimState.currentMode === mode_1.ModeName.Normal;
            // Record down previous action and flush temporary state
            if (ranRepeatableAction) {
                vimState.previousFullAction = vimState.recordedState;
            }
            if (ranAction) {
                vimState.recordedState = new RecordedState();
            }
            // track undo history
            if (!this.vimState.focusChanged) {
                // important to ensure that focus didn't change, otherwise
                // we'll grab the text of the incorrect active window and assume the
                // whole document changed!
                if (this._vimState.alteredHistory) {
                    this._vimState.alteredHistory = false;
                    vimState.historyTracker.ignoreChange();
                }
                else {
                    vimState.historyTracker.addChange(this._vimState.cursorPositionJustBeforeAnythingHappened);
                }
            }
            if (ranRepeatableAction) {
                vimState.historyTracker.finishCurrentStep();
            }
            // console.log(vimState.historyTracker.toString());
            recordedState.actionKeys = [];
            vimState.currentRegisterMode = register_1.RegisterMode.FigureItOutFromCurrentMode;
            if (this.currentModeName === mode_1.ModeName.Normal) {
                vimState.cursorStartPosition = vimState.cursorPosition;
            }
            // Ensure cursor is within bounds
            if (vimState.cursorPosition.line >= textEditor_1.TextEditor.getLineCount()) {
                vimState.cursorPosition = vimState.cursorPosition.getDocumentEnd();
            }
            const currentLineLength = textEditor_1.TextEditor.getLineAt(vimState.cursorPosition).text.length;
            if (vimState.currentMode === mode_1.ModeName.Normal &&
                vimState.cursorPosition.character >= currentLineLength &&
                currentLineLength > 0) {
                vimState.cursorPosition = new position_1.Position(vimState.cursorPosition.line, currentLineLength - 1);
            }
            return vimState;
        });
    }
    executeMovement(vimState, movement) {
        return __awaiter(this, void 0, Promise, function* () {
            let recordedState = vimState.recordedState;
            const result = yield movement.execActionWithCount(vimState.cursorPosition, vimState, recordedState.count);
            if (result instanceof position_1.Position) {
                vimState.cursorPosition = result;
            }
            else if (actions_1.isIMovement(result)) {
                vimState.cursorPosition = result.stop;
                vimState.cursorStartPosition = result.start;
                vimState.currentRegisterMode = result.registerMode;
            }
            vimState.recordedState.count = 0;
            let stop = vimState.cursorPosition;
            // Keep the cursor within bounds
            if (vimState.currentMode === mode_1.ModeName.Normal && !recordedState.operator) {
                if (stop.character >= position_1.Position.getLineLength(stop.line)) {
                    vimState.cursorPosition = stop.getLineEnd().getLeft();
                }
            }
            else {
                // Vim does this weird thing where it allows you to select and delete
                // the newline character, which it places 1 past the last character
                // in the line. This is why we use > instead of >=.
                if (stop.character > position_1.Position.getLineLength(stop.line)) {
                    vimState.cursorPosition = stop.getLineEnd();
                }
            }
            return vimState;
        });
    }
    executeOperator(vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            let start = vimState.cursorStartPosition;
            let stop = vimState.cursorPosition;
            let recordedState = vimState.recordedState;
            if (recordedState.operator) {
                if (vimState.currentMode !== mode_1.ModeName.Visual &&
                    vimState.currentMode !== mode_1.ModeName.VisualLine &&
                    vimState.currentRegisterMode !== register_1.RegisterMode.LineWise) {
                    if (position_1.Position.EarlierOf(start, stop) === start) {
                        stop = stop.getLeft();
                    }
                    else {
                        stop = stop.getRight();
                    }
                }
                if (start.compareTo(stop) > 0) {
                    [start, stop] = [stop, start];
                }
                if (this.currentModeName === mode_1.ModeName.VisualLine) {
                    start = start.getLineBegin();
                    stop = stop.getLineEnd();
                    vimState.currentRegisterMode = register_1.RegisterMode.LineWise;
                }
                return yield recordedState.operator.run(vimState, start, stop);
            }
            console.log("This is bad! Execution should never get here.");
        });
    }
    executeCommand(vimState) {
        return __awaiter(this, void 0, Promise, function* () {
            const command = vimState.commandAction;
            vimState.commandAction = VimSpecialCommands.Nothing;
            switch (command) {
                case VimSpecialCommands.ShowCommandLine:
                    yield main_1.showCmdLine("", this);
                    break;
                case VimSpecialCommands.Dot:
                    const clonedAction = vimState.previousFullAction.clone();
                    yield this.rerunRecordedState(vimState, vimState.previousFullAction);
                    vimState.previousFullAction = clonedAction;
                    break;
            }
            return vimState;
        });
    }
    rerunRecordedState(vimState, recordedState) {
        return __awaiter(this, void 0, Promise, function* () {
            const actions = recordedState.actionsRun.slice(0);
            recordedState = new RecordedState();
            vimState.recordedState = recordedState;
            let i = 0;
            for (let action of actions) {
                recordedState.actionsRun = actions.slice(0, ++i);
                vimState = yield this.runAction(vimState, recordedState, action);
            }
            recordedState.actionsRun = actions;
            return vimState;
        });
    }
    updateView(vimState, drawSelection = true) {
        return __awaiter(this, void 0, Promise, function* () {
            // Update cursor position
            let start = vimState.cursorStartPosition;
            let stop = vimState.cursorPosition;
            if (vimState.currentMode === mode_1.ModeName.Visual) {
                /**
                 * Always select the letter that we started visual mode on, no matter
                 * if we are in front or behind it. Imagine that we started visual mode
                 * with some text like this:
                 *
                 *   abc|def
                 *
                 * (The | represents the cursor.) If we now press w, we'll select def,
                 * but if we hit b we expect to select abcd, so we need to getRight() on the
                 * start of the selection when it precedes where we started visual mode.
                 */
                if (start.compareTo(stop) > 0) {
                    start = start.getRight();
                }
            }
            // Draw selection (or cursor)
            if (drawSelection) {
                let selection;
                if (vimState.currentMode === mode_1.ModeName.Visual) {
                    selection = new vscode.Selection(start, stop);
                }
                else if (vimState.currentMode === mode_1.ModeName.VisualLine) {
                    selection = new vscode.Selection(position_1.Position.EarlierOf(start, stop).getLineBegin(), position_1.Position.LaterOf(start, stop).getLineEnd());
                }
                else {
                    selection = new vscode.Selection(stop, stop);
                }
                this._vimState.whatILastSetTheSelectionTo = selection;
                vscode.window.activeTextEditor.selection = selection;
            }
            // Scroll to position of cursor
            vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition));
            let rangesToDraw = [];
            // Draw block cursor.
            if (vimState.settings.useSolidBlockCursor) {
                if (this.currentMode.name !== mode_1.ModeName.Insert) {
                    rangesToDraw.push(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition.getRight()));
                }
            }
            else {
                // Use native block cursor if possible.
                const options = vscode.window.activeTextEditor.options;
                options.cursorStyle = this.currentMode.cursorType === mode_1.VSCodeVimCursorType.Native &&
                    this.currentMode.name !== mode_1.ModeName.Insert ?
                    vscode.TextEditorCursorStyle.Block : vscode.TextEditorCursorStyle.Line;
                vscode.window.activeTextEditor.options = options;
            }
            if (this.currentMode.cursorType === mode_1.VSCodeVimCursorType.TextDecoration &&
                this.currentMode.name !== mode_1.ModeName.Insert) {
                // Fake block cursor with text decoration. Unfortunately we can't have a cursor
                // in the middle of a selection natively, which is what we need for Visual Mode.
                rangesToDraw.push(new vscode.Range(stop, stop.getRight()));
            }
            // Draw marks
            // I should re-enable this with a config setting at some point
            /*
    
            for (const mark of this.vimState.historyTracker.getMarks()) {
                rangesToDraw.push(new vscode.Range(mark.position, mark.position.getRight()));
            }
    
            */
            // Draw search highlight
            const searchState = vimState.searchState;
            if (this.currentMode.name === mode_1.ModeName.SearchInProgressMode) {
                rangesToDraw.push.apply(rangesToDraw, searchState.matchRanges);
                const { pos, match } = searchState.getNextSearchMatchPosition(vimState.cursorPosition);
                if (match) {
                    rangesToDraw.push(new vscode.Range(pos, pos.getRight(searchState.searchString.length)));
                }
            }
            vscode.window.activeTextEditor.setDecorations(this._caretDecoration, rangesToDraw);
            this.setupStatusBarItem(`-- ${this.currentMode.text.toUpperCase()} --`);
            vscode.commands.executeCommand('setContext', 'vim.mode', this.currentMode.text);
        });
    }
    handleMultipleKeyEvents(keys) {
        return __awaiter(this, void 0, Promise, function* () {
            for (const key of keys) {
                yield this.handleKeyEvent(key);
            }
        });
    }
    setupStatusBarItem(text) {
        if (!ModeHandler._statusBarItem) {
            ModeHandler._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
        ModeHandler._statusBarItem.text = text || '';
        ModeHandler._statusBarItem.show();
    }
    dispose() {
    }
}
ModeHandler.IsTesting = false;
exports.ModeHandler = ModeHandler;
//# sourceMappingURL=modeHandler.js.map