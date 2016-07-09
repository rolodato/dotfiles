"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var vscode = require("vscode");
var position_1 = require('./position');
(function (MotionMode) {
    MotionMode[MotionMode["Caret"] = 0] = "Caret";
    MotionMode[MotionMode["Cursor"] = 1] = "Cursor";
})(exports.MotionMode || (exports.MotionMode = {}));
var MotionMode = exports.MotionMode;
class Motion {
    constructor(mode) {
        this._disposables = new Array();
        // Caret Styling
        this._caretDecoration = vscode.window.createTextEditorDecorationType({
            dark: {
                // used for dark colored themes
                backgroundColor: 'rgba(224, 224, 224, 0.4)',
                borderColor: 'rgba(240, 240, 240, 0.8)'
            },
            light: {
                // used for light colored themes
                backgroundColor: 'rgba(32, 32, 32, 0.4)',
                borderColor: 'rgba(16, 16, 16, 0.8)'
            },
            borderStyle: 'solid',
            borderWidth: '1px'
        });
        // initialize to current position
        let currentPosition = vscode.window.activeTextEditor.selection.active;
        this._position = new position_1.Position(currentPosition.line, currentPosition.character);
        if (mode !== null) {
            this.changeMode(mode);
        }
        this._disposables.push(vscode.window.onDidChangeTextEditorSelection(e => {
            // handle scenarios where mouse used to change current position
            let selection = e.selections[0];
            if (selection) {
                let line = selection.active.line;
                let char = selection.active.character;
                var newPosition = new position_1.Position(line, char);
                if (char > newPosition.getLineEnd().character) {
                    newPosition = new position_1.Position(newPosition.line, newPosition.getLineEnd().character);
                }
                this.position = newPosition;
                this.changeMode(this._motionMode);
            }
        }));
    }
    get position() {
        return this._position;
    }
    set position(val) {
        this._position = val;
        this.redraw();
    }
    changeMode(mode) {
        this._motionMode = mode;
        this.redraw();
        return this;
    }
    move() {
        return this.moveTo(null, null);
    }
    moveTo(line, character) {
        if (line !== null && character !== null) {
            this._position = this._position.setLocation(line, character);
        }
        if (!this.position.isValid()) {
            throw new RangeError(`Invalid position. Line=${line}, Character=${character}`);
        }
        let selection = new vscode.Selection(this.position, this.position);
        vscode.window.activeTextEditor.selection = selection;
        if (this._motionMode === MotionMode.Caret) {
            this.highlightBlock(this.position);
        }
        return this;
    }
    redraw() {
        switch (this._motionMode) {
            case MotionMode.Caret:
                // Valid Positions for Caret: [0, eol)
                this.highlightBlock(this.position);
                break;
            case MotionMode.Cursor:
                // Valid Positions for Caret: [0, eol]
                vscode.window.activeTextEditor.setDecorations(this._caretDecoration, []);
                break;
        }
    }
    /**
     * Allows us to simulate a block cursor by highlighting a 1 character
     * space at the provided position in a lighter color.
     */
    highlightBlock(start) {
        this.highlightRange(start, new position_1.Position(start.line, start.character + 1));
    }
    /**
     * Highlights the range from start to end in the color of a block cursor.
     */
    highlightRange(start, end) {
        let range = new vscode.Range(start, end);
        vscode.window.activeTextEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        vscode.window.activeTextEditor.setDecorations(this._caretDecoration, [range]);
    }
    select(from, to) {
        let selection = new vscode.Selection(from, to);
        vscode.window.activeTextEditor.selection = selection;
        this.highlightBlock(to);
    }
    left() {
        this._position = this.position.getLeft();
        return this;
    }
    right() {
        this._position = this.position.getRight();
        return this;
    }
    down() {
        this._position = this.position.getDown(0);
        return this;
    }
    up() {
        this._position = this.position.getUp(0);
        return this;
    }
    wordLeft() {
        this._position = this.position.getWordLeft();
        return this;
    }
    bigWordLeft() {
        this._position = this.position.getBigWordLeft();
        return this;
    }
    wordRight() {
        this._position = this.position.getWordRight();
        return this;
    }
    bigWordRight() {
        this._position = this.position.getBigWordRight();
        return this;
    }
    lineBegin() {
        this._position = this.position.getLineBegin();
        return this;
    }
    lineEnd() {
        this._position = this.position.getLineEnd();
        return this;
    }
    firstLineNonBlankChar() {
        this._position = this.position.setLocation(0, position_1.Position.getFirstNonBlankCharAtLine(0));
        return this;
    }
    lastLineNonBlankChar() {
        let lastLine = this.position.getDocumentEnd().line;
        let character = position_1.Position.getFirstNonBlankCharAtLine(lastLine);
        this._position = this.position.setLocation(lastLine, character);
        return this;
    }
    documentBegin() {
        this._position = this.position.getDocumentBegin();
        return this;
    }
    documentEnd() {
        this._position = this.position.getDocumentEnd();
        return this;
    }
    goToEndOfLastWord() {
        this._position = this.position.getLastWordEnd();
        return this;
    }
    goToEndOfLastBigWord() {
        this._position = this.position.getLastBigWordEnd();
        return this;
    }
    goToEndOfCurrentWord() {
        this._position = this.position.getCurrentWordEnd();
        return this;
    }
    goToEndOfCurrentBigWord() {
        this._position = this.position.getCurrentBigWordEnd();
        return this;
    }
    goToEndOfCurrentParagraph() {
        this._position = this.position.getCurrentParagraphEnd();
        return this;
    }
    goToBeginningOfCurrentParagraph() {
        this._position = this.position.getCurrentParagraphBeginning();
        return this;
    }
    dispose() {
        _.each(this._disposables, d => {
            d.dispose();
        });
    }
}
exports.Motion = Motion;
//# sourceMappingURL=motion.js.map