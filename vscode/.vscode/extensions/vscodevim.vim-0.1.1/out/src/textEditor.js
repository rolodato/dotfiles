"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require("vscode");
const modeHandler_1 = require('./mode/modeHandler');
class TextEditor {
    // TODO: Refactor args
    static insert(text, at = undefined, letVSCodeHandleKeystrokes = undefined) {
        return __awaiter(this, void 0, Promise, function* () {
            // If we insert "blah(" with default:type, VSCode will insert the closing ).
            // We *probably* don't want that to happen if we're inserting a lot of text.
            if (letVSCodeHandleKeystrokes === undefined) {
                letVSCodeHandleKeystrokes = text.length === 1;
            }
            if (at) {
                vscode.window.activeTextEditor.selection = new vscode.Selection(at, at);
            }
            if (modeHandler_1.ModeHandler.IsTesting || !letVSCodeHandleKeystrokes) {
                return vscode.window.activeTextEditor.edit(editBuilder => {
                    editBuilder.insert(vscode.window.activeTextEditor.selection.active, text);
                });
            }
            else {
                yield vscode.commands.executeCommand('default:type', { text: text });
            }
            return true;
        });
    }
    static insertAt(text, position) {
        return __awaiter(this, void 0, Promise, function* () {
            return vscode.window.activeTextEditor.edit(editBuilder => {
                editBuilder.insert(position, text);
            });
        });
    }
    static delete(range) {
        return __awaiter(this, void 0, Promise, function* () {
            return vscode.window.activeTextEditor.edit(editBuilder => {
                editBuilder.delete(range);
            });
        });
    }
    /**
     * Removes all text in the entire document.
     */
    static deleteDocument() {
        return __awaiter(this, void 0, Promise, function* () {
            const start = new vscode.Position(0, 0);
            const lastLine = vscode.window.activeTextEditor.document.lineCount - 1;
            const end = vscode.window.activeTextEditor.document.lineAt(lastLine).range.end;
            const range = new vscode.Range(start, end);
            return vscode.window.activeTextEditor.edit(editBuilder => {
                editBuilder.delete(range);
            });
        });
    }
    static replace(range, text) {
        return __awaiter(this, void 0, Promise, function* () {
            return vscode.window.activeTextEditor.edit(editBuilder => {
                editBuilder.replace(range, text);
            });
        });
    }
    static getAllText() {
        return vscode.window.activeTextEditor.document.getText();
    }
    static readLine() {
        const lineNo = vscode.window.activeTextEditor.selection.active.line;
        return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
    }
    static readLineAt(lineNo) {
        if (lineNo === null) {
            lineNo = vscode.window.activeTextEditor.selection.active.line;
        }
        if (lineNo >= vscode.window.activeTextEditor.document.lineCount) {
            throw new RangeError();
        }
        return vscode.window.activeTextEditor.document.lineAt(lineNo).text;
    }
    static getLineCount() {
        return vscode.window.activeTextEditor.document.lineCount;
    }
    static getLineAt(position) {
        return vscode.window.activeTextEditor.document.lineAt(position);
    }
    static getSelection() {
        return vscode.window.activeTextEditor.selection;
    }
    static getText(selection) {
        return vscode.window.activeTextEditor.document.getText(selection);
    }
    static isFirstLine(position) {
        return position.line === 0;
    }
    static isLastLine(position) {
        return position.line === (vscode.window.activeTextEditor.document.lineCount - 1);
    }
}
exports.TextEditor = TextEditor;
//# sourceMappingURL=textEditor.js.map