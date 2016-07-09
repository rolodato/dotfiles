/**
 * HistoryTracker is a handrolled undo/redo tracker for VSC. We currently
 * track history as a list of "steps", each of which consists of 1 or more
 * "changes".
 *
 * A Change is something like adding or deleting a few letters.
 *
 * A Step is multiple Changes.
 *
 * Undo/Redo will advance forward or backwards through Steps.
 */
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
const _ = require("lodash");
const position_1 = require('./../motion/position');
const textEditor_1 = require('./../textEditor');
const jsdiff = require('diff');
class DocumentChange {
    constructor(start, text, isAdd) {
        this.start = start;
        this.text = text;
        this.isAdd = isAdd;
    }
    /**
     * Run this change.
     */
    do(undo = false) {
        return __awaiter(this, void 0, Promise, function* () {
            const rangeStart = this.start;
            if ((this.isAdd && !undo) || (!this.isAdd && undo)) {
                yield textEditor_1.TextEditor.insert(this.text, rangeStart, false);
            }
            else {
                const rangeStop = rangeStart.advancePositionByText(this.text);
                yield textEditor_1.TextEditor.delete(new vscode.Range(rangeStart, rangeStop));
            }
        });
    }
    /**
     * Run this change in reverse.
     */
    undo() {
        return __awaiter(this, void 0, Promise, function* () {
            return this.do(true);
        });
    }
}
exports.DocumentChange = DocumentChange;
class HistoryStep {
    constructor(init) {
        /**
         * The insertions and deletions that occured in this history step.
         */
        this.changes = [];
        /**
         * Whether the user is still inserting or deleting for this history step.
         */
        this.isFinished = false;
        /**
         * The cursor position at the start of this history step.
         */
        this.cursorStart = undefined;
        /**
         * The position of every mark at the start of this history step.
         */
        this.marks = [];
        this.changes = init.changes = [];
        this.isFinished = init.isFinished || false;
        this.cursorStart = init.cursorStart || undefined;
        this.marks = init.marks || [];
    }
}
class HistoryTracker {
    constructor() {
        /**
         * The entire Undo/Redo stack.
         */
        this.historySteps = [];
        /**
         * Our index in the Undo/Redo stack.
         */
        this.currentHistoryStepIndex = 0;
        /**
         * We add an initial, unrevertable step, which inserts the entire document.
         */
        this.historySteps.push(new HistoryStep({
            changes: [new DocumentChange(new position_1.Position(0, 0), textEditor_1.TextEditor.getAllText(), true)],
            isFinished: true,
            cursorStart: new position_1.Position(0, 0)
        }));
        this.finishCurrentStep();
        this.oldText = textEditor_1.TextEditor.getAllText();
    }
    get currentHistoryStep() {
        if (this.currentHistoryStepIndex === -1) {
            console.log("Tried to modify history at index -1");
            throw new Error();
        }
        return this.historySteps[this.currentHistoryStepIndex];
    }
    _addNewHistoryStep() {
        this.historySteps.push(new HistoryStep({
            marks: this.currentHistoryStep.marks
        }));
        this.currentHistoryStepIndex++;
    }
    /**
     * Marks refer to relative locations in the document, rather than absolute ones.
     *
     * This big gnarly method updates our marks such that they continue to mark
     * the same character when the user does a document edit that would move the
     * text that was marked.
     */
    updateAndReturnMarks() {
        const previousMarks = this.currentHistoryStep.marks;
        let newMarks = [];
        // clone old marks into new marks
        for (const mark of previousMarks) {
            newMarks.push({
                name: mark.name,
                position: mark.position,
                isUppercaseMark: mark.isUppercaseMark
            });
        }
        for (const change of this.currentHistoryStep.changes) {
            for (const newMark of newMarks) {
                // Run through each character added/deleted, and see if it could have
                // affected the position of this mark.
                let pos = change.start;
                if (change.isAdd) {
                    // (Yes, I could merge these together, but that would obfusciate the logic.)
                    for (const ch of change.text) {
                        // Update mark
                        if (pos.compareTo(newMark.position) <= 0) {
                            if (ch === "\n") {
                                newMark.position = new position_1.Position(newMark.position.line + 1, newMark.position.character);
                            }
                            else if (ch !== "\n" && pos.line === newMark.position.line) {
                                newMark.position = new position_1.Position(newMark.position.line, newMark.position.character + 1);
                            }
                        }
                        // Advance position
                        if (ch === "\n") {
                            pos = new position_1.Position(pos.line + 1, 0);
                        }
                        else {
                            pos = new position_1.Position(pos.line, pos.character + 1);
                        }
                    }
                }
                else {
                    for (const ch of change.text) {
                        // Update mark
                        if (pos.compareTo(newMark.position) < 0) {
                            if (ch === "\n") {
                                newMark.position = new position_1.Position(newMark.position.line - 1, newMark.position.character);
                            }
                            else if (pos.line === newMark.position.line) {
                                newMark.position = new position_1.Position(newMark.position.line, newMark.position.character - 1);
                            }
                        }
                        // De-advance position
                        // (What's the opposite of advance? Retreat position?)
                        if (ch === "\n") {
                            // The 99999 is a bit of a hack here. It's very difficult and
                            // completely unnecessary to get the correct position, so we
                            // just fake it.
                            pos = new position_1.Position(Math.max(pos.line - 1, 0), 99999);
                        }
                        else {
                            pos = new position_1.Position(pos.line, Math.max(pos.character - 1, 0));
                        }
                    }
                }
            }
        }
        // Ensure the position of every mark is within the range of the document.
        for (const mark of newMarks) {
            if (mark.position.compareTo(mark.position.getDocumentEnd()) > 0) {
                mark.position = mark.position.getDocumentEnd();
            }
        }
        return newMarks;
    }
    /**
     * Adds a mark.
     */
    addMark(position, markName) {
        const newMark = {
            position: position,
            name: markName,
            isUppercaseMark: markName === markName.toUpperCase()
        };
        const previousIndex = _.findIndex(this.currentHistoryStep.marks, mark => mark.name === markName);
        if (previousIndex !== -1) {
            this.currentHistoryStep.marks[previousIndex] = newMark;
        }
        else {
            this.currentHistoryStep.marks.push(newMark);
        }
    }
    /**
     * Retrieves a mark.
     */
    getMark(markName) {
        return _.find(this.currentHistoryStep.marks, mark => mark.name === markName);
    }
    getMarks() {
        return this.currentHistoryStep.marks;
    }
    /**
     * Adds an individual Change to the current Step.
     *
     * Determines what changed by diffing the document against what it
     * used to look like.
     */
    addChange(cursorPosition = new position_1.Position(0, 0)) {
        const newText = textEditor_1.TextEditor.getAllText();
        if (newText === this.oldText) {
            return;
        }
        // Determine if we should add a new Step.
        if (this.currentHistoryStepIndex === this.historySteps.length - 1 &&
            this.currentHistoryStep.isFinished) {
            this._addNewHistoryStep();
        }
        else if (this.currentHistoryStepIndex !== this.historySteps.length - 1) {
            this.historySteps = this.historySteps.slice(0, this.currentHistoryStepIndex + 1);
            this._addNewHistoryStep();
        }
        // TODO: This is actually pretty stupid! Since we already have the cursorPosition,
        // and most diffs are just +/- a few characters, we can just do a direct comparison rather
        // than using jsdiff.
        // The difficulty is with a few rare commands like :%s/one/two/g that make
        // multiple changes in different places simultaneously. For those, we could require
        // them to call addChange manually, I guess...
        const diffs = jsdiff.diffChars(this.oldText, newText);
        let currentPosition = new position_1.Position(0, 0);
        for (const diff of diffs) {
            let change;
            // let lastChange = this.currentHistoryStep.changes.length > 1 &&
            //   this.currentHistoryStep.changes[this.currentHistoryStep.changes.length - 2];
            if (diff.added) {
                change = new DocumentChange(currentPosition, diff.value, true);
            }
            else if (diff.removed) {
                change = new DocumentChange(currentPosition, diff.value, false);
            }
            // attempt to merge with last change
            let couldMerge = false;
            /*

            // TODO: This doesn't work in like 1% of cases. Can't figure out why!

            // If you mash on your keyboard and backspace for like 2 minutes and then undo
            // you might see it happen.

            if (lastChange && lastChange.start.getDocumentEnd().compareTo(lastChange.start) > 0) {
                if (diff.added && lastChange.start.getRight().advancePositionByText(lastChange.text).isEqual(currentPosition)) {
                    lastChange.text += change.text;
                    couldMerge = true;
                }
            }

            */
            if (!couldMerge && change) {
                this.currentHistoryStep.changes.push(change);
            }
            if (change && this.currentHistoryStep.cursorStart === undefined) {
                this.currentHistoryStep.cursorStart = cursorPosition;
            }
            if (!diff.removed) {
                currentPosition = currentPosition.advancePositionByText(diff.value);
            }
        }
        this.oldText = newText;
    }
    /**
     * Both undoes and completely removes the last n changes applied.
     */
    undoAndRemoveChanges(n) {
        return __awaiter(this, void 0, Promise, function* () {
            if (this.currentHistoryStep.changes.length < n) {
                console.log("Something bad happened in removeChange");
                return;
            }
            for (let i = 0; i < n; i++) {
                this.currentHistoryStep.changes.pop().undo();
            }
        });
    }
    /**
     * Tells the HistoryTracker that although the document has changed, we should simply
     * ignore that change. Most often used when the change was itself triggered by
     * the HistoryTracker.
     */
    ignoreChange() {
        this.oldText = textEditor_1.TextEditor.getAllText();
    }
    /**
     * Until we mark it as finished, the active Step will
     * accrue multiple changes. This function will mark it as finished,
     * and the next time we add a change, it'll be added to a new Step.
     */
    finishCurrentStep() {
        if (this.currentHistoryStep.changes.length === 0) {
            return;
        }
        this.currentHistoryStep.isFinished = true;
        this.currentHistoryStep.marks = this.updateAndReturnMarks();
    }
    /**
     * Essentially Undo or ctrl+z. Returns undefined if there's no more steps
     * back to go.
     */
    goBackHistoryStep() {
        return __awaiter(this, void 0, Promise, function* () {
            let step;
            if (this.currentHistoryStepIndex === 0) {
                return undefined;
            }
            if (this.currentHistoryStep.changes.length === 0) {
                this.currentHistoryStepIndex--;
            }
            if (this.currentHistoryStepIndex === 0) {
                return undefined;
            }
            step = this.currentHistoryStep;
            for (const change of step.changes.slice(0).reverse()) {
                yield change.undo();
            }
            this.currentHistoryStepIndex--;
            return step && step.cursorStart;
        });
    }
    /**
     * Essentially Redo or ctrl+y. Returns undefined if there's no more steps
     * forward to go.
     */
    goForwardHistoryStep() {
        return __awaiter(this, void 0, Promise, function* () {
            let step;
            if (this.currentHistoryStepIndex === this.historySteps.length - 1) {
                return undefined;
            }
            this.currentHistoryStepIndex++;
            step = this.currentHistoryStep;
            for (const change of step.changes) {
                yield change.do();
            }
            return step.cursorStart;
        });
    }
    /**
     * Handy for debugging the undo/redo stack. + means our current position, check
     * means active.
     */
    toString() {
        let result = "";
        for (let i = 0; i < this.historySteps.length; i++) {
            const step = this.historySteps[i];
            result += step.changes.map(x => x.text.replace(/\n/g, "\\n")).join("");
            if (this.currentHistoryStepIndex === i) {
                result += "+";
            }
            if (step.isFinished) {
                result += "✓";
            }
            result += "| ";
        }
        return result;
    }
}
exports.HistoryTracker = HistoryTracker;
//# sourceMappingURL=historyTracker.js.map