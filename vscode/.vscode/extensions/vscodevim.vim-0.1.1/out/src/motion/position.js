"use strict";
const _ = require("lodash");
const vscode = require("vscode");
const textEditor_1 = require("./../textEditor");
class Position extends vscode.Position {
    constructor(line, character) {
        super(line, character);
        this._nonWordCharRegex = this.makeWordRegex(Position.NonWordCharacters);
        this._nonBigWordCharRegex = this.makeWordRegex(Position.NonBigWordCharacters);
        this._sentenceEndRegex = /[\.!\?]{1}([ \n\t]+|$)/g;
    }
    static FromVSCodePosition(pos) {
        return new Position(pos.line, pos.character);
    }
    /**
     * Returns which of the 2 provided Positions comes earlier in the document.
     */
    static EarlierOf(p1, p2) {
        if (p1.line < p2.line) {
            return p1;
        }
        if (p1.line === p2.line && p1.character < p2.character) {
            return p1;
        }
        return p2;
    }
    /**
     * Iterates over every position in the document starting at start, returning
     * at every position the current line text, character text, and a position object.
     */
    static *IterateDocument(start, forward = true) {
        let lineIndex, charIndex;
        if (forward) {
            for (lineIndex = start.line; lineIndex < textEditor_1.TextEditor.getLineCount(); lineIndex++) {
                charIndex = lineIndex === start.line ? start.character : 0;
                const line = textEditor_1.TextEditor.getLineAt(new Position(lineIndex, 0)).text;
                for (; charIndex < line.length; charIndex++) {
                    yield {
                        line: line,
                        char: line[charIndex],
                        pos: new Position(lineIndex, charIndex)
                    };
                }
            }
        }
        else {
            for (lineIndex = start.line; lineIndex >= 0; lineIndex--) {
                const line = textEditor_1.TextEditor.getLineAt(new Position(lineIndex, 0)).text;
                charIndex = lineIndex === start.line ? start.character : line.length - 1;
                for (; charIndex >= 0; charIndex--) {
                    yield {
                        line: line,
                        char: line[charIndex],
                        pos: new Position(lineIndex, charIndex)
                    };
                }
            }
        }
    }
    /**
     * Returns which of the 2 provided Positions comes later in the document.
     */
    static LaterOf(p1, p2) {
        if (Position.EarlierOf(p1, p2) === p1) {
            return p2;
        }
        return p1;
    }
    setLocation(line, character) {
        let position = new Position(line, character);
        return position;
    }
    getLeft() {
        if (!this.isLineBeginning()) {
            return new Position(this.line, this.character - 1);
        }
        return this;
    }
    /**
     * Same as getLeft, but goes up to the previous line on line
     * breaks.
     *
     * Equivalent to left arrow (in a non-vim editor!)
     */
    getLeftThroughLineBreaks() {
        if (!this.isLineBeginning()) {
            return this.getLeft();
        }
        return new Position(this.line - 1, 0)
            .getLineEnd();
    }
    getRightThroughLineBreaks() {
        if (this.isAtDocumentEnd()) {
            // TODO(bell)
            return this;
        }
        if (this.getRight().isLineEnd()) {
            return this.getDown(0);
        }
        return this.getRight();
    }
    getRight(count = 1) {
        if (!this.isLineEnd()) {
            return new Position(this.line, this.character + count);
        }
        return this;
    }
    /**
     * Get the position of the line directly below the current line.
     */
    getDown(desiredColumn) {
        if (this.getDocumentEnd().line !== this.line) {
            let nextLine = this.line + 1;
            let nextLineLength = Position.getLineLength(nextLine);
            return new Position(nextLine, Math.min(nextLineLength, desiredColumn));
        }
        return this;
    }
    /**
     * Get the position of the line directly above the current line.
     */
    getUp(desiredColumn) {
        if (this.getDocumentBegin().line !== this.line) {
            let prevLine = this.line - 1;
            let prevLineLength = Position.getLineLength(prevLine);
            return new Position(prevLine, Math.min(prevLineLength, desiredColumn));
        }
        return this;
    }
    /**
     * Get the position *count* lines down from this position, but not lower
     * than the end of the document.
     */
    getDownByCount(count = 0) {
        return new Position(Math.min(textEditor_1.TextEditor.getLineCount() - 1, this.line + count), this.character);
    }
    /**
     * Get the position *count* lines up from this position, but not lower
     * than the end of the document.
     */
    getUpByCount(count = 0) {
        return new Position(Math.max(0, this.line - count), this.character);
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getWordLeft(inclusive = false) {
        return this.getWordLeftWithRegex(this._nonWordCharRegex, inclusive);
    }
    getBigWordLeft() {
        return this.getWordLeftWithRegex(this._nonBigWordCharRegex);
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getWordRight(inclusive = false) {
        return this.getWordRightWithRegex(this._nonWordCharRegex, inclusive);
    }
    getBigWordRight() {
        return this.getWordRightWithRegex(this._nonBigWordCharRegex);
    }
    getLastWordEnd() {
        return this.getLastWordEndWithRegex(this._nonWordCharRegex);
    }
    getLastBigWordEnd() {
        return this.getLastWordEndWithRegex(this._nonBigWordCharRegex);
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getCurrentWordEnd(inclusive = false) {
        return this.getCurrentWordEndWithRegex(this._nonWordCharRegex, inclusive);
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getCurrentBigWordEnd(inclusive = false) {
        return this.getCurrentWordEndWithRegex(this._nonBigWordCharRegex, inclusive);
    }
    /**
     * Get the end of the current paragraph.
     */
    getCurrentParagraphEnd() {
        let pos = this;
        // If we're not in a paragraph yet, go down until we are.
        while (textEditor_1.TextEditor.getLineAt(pos).text === "" && !textEditor_1.TextEditor.isLastLine(pos)) {
            pos = pos.getDown(0);
        }
        // Go until we're outside of the paragraph, or at the end of the document.
        while (textEditor_1.TextEditor.getLineAt(pos).text !== "" && pos.line < textEditor_1.TextEditor.getLineCount() - 1) {
            pos = pos.getDown(0);
        }
        return pos.getLineEnd();
    }
    /**
     * Get the beginning of the current paragraph.
     */
    getCurrentParagraphBeginning() {
        let pos = this;
        // If we're not in a paragraph yet, go up until we are.
        while (textEditor_1.TextEditor.getLineAt(pos).text === "" && !textEditor_1.TextEditor.isFirstLine(pos)) {
            pos = pos.getUp(0);
        }
        // Go until we're outside of the paragraph, or at the beginning of the document.
        while (pos.line > 0 && textEditor_1.TextEditor.getLineAt(pos).text !== "") {
            pos = pos.getUp(0);
        }
        return pos.getLineBegin();
    }
    getPreviousSentenceBegin() {
        return this.getPreviousSentenceBeginWithRegex(this._sentenceEndRegex, false);
    }
    getNextSentenceBegin() {
        return this.getNextSentenceBeginWithRegex(this._sentenceEndRegex, false);
    }
    /**
     * Get the beginning of the current line.
     */
    getLineBegin() {
        return new Position(this.line, 0);
    }
    /**
     * Get the beginning of the next line.
     */
    getPreviousLineBegin() {
        if (this.line === 0) {
            return this.getLineBegin();
        }
        return new Position(this.line - 1, 0);
    }
    /**
     * Get the beginning of the next line.
     */
    getNextLineBegin() {
        if (this.line >= textEditor_1.TextEditor.getLineCount() - 1) {
            return this.getLineEnd();
        }
        return new Position(this.line + 1, 0);
    }
    /**
     * Returns a new position at the end of this position's line.
     */
    getLineEnd() {
        return new Position(this.line, Position.getLineLength(this.line));
    }
    /**
     * Returns a new position at the end of this position's line, including the
     * invisible newline character.
     */
    getLineEndIncludingEOL() {
        return new Position(this.line, Position.getLineLength(this.line) + 1);
    }
    getDocumentBegin() {
        return new Position(0, 0);
    }
    /**
     * Get the position that the cursor would be at if you
     * pasted *text* at the current position.
     */
    advancePositionByText(text) {
        const numberOfLinesSpanned = (text.match(/\n/g) || []).length;
        return new Position(this.line + numberOfLinesSpanned, numberOfLinesSpanned === 0 ?
            this.character + text.length :
            text.length - (text.lastIndexOf('\n') + 1));
    }
    getDocumentEnd() {
        let lineCount = textEditor_1.TextEditor.getLineCount();
        let line = lineCount > 0 ? lineCount - 1 : 0;
        let char = Position.getLineLength(line);
        return new Position(line, char);
    }
    isValid() {
        // line
        let lineCount = textEditor_1.TextEditor.getLineCount();
        if (this.line > lineCount) {
            return false;
        }
        // char
        let charCount = Position.getLineLength(this.line);
        if (this.character > charCount + 1) {
            return false;
        }
        return true;
    }
    /**
     * Is this position at the beginning of the line?
     */
    isLineBeginning() {
        return this.character === 0;
    }
    /**
     * Is this position at the end of the line?
     */
    isLineEnd() {
        return this.character >= Position.getLineLength(this.line);
    }
    isAtDocumentEnd() {
        return this.line === textEditor_1.TextEditor.getLineCount() - 1 && this.isLineEnd();
    }
    static getFirstNonBlankCharAtLine(line) {
        return textEditor_1.TextEditor.readLineAt(line).match(/^\s*/)[0].length;
    }
    /**
     * The position of the first character on this line which is not whitespace.
     */
    getFirstLineNonBlankChar() {
        return new Position(this.line, Position.getFirstNonBlankCharAtLine(this.line));
    }
    getDocumentStart() {
        return new Position(0, 0);
    }
    static getLineLength(line) {
        return textEditor_1.TextEditor.readLineAt(line).length;
    }
    makeWordRegex(characterSet) {
        let escaped = characterSet && _.escapeRegExp(characterSet);
        let segments = [];
        segments.push(`([^\\s${escaped}]+)`);
        segments.push(`[${escaped}]+`);
        segments.push(`$^`);
        let result = new RegExp(segments.join("|"), "g");
        return result;
    }
    getAllPositions(line, regex) {
        let positions = [];
        let result = regex.exec(line);
        while (result) {
            positions.push(result.index);
            // Handles the case where an empty string match causes lastIndex not to advance,
            // which gets us in an infinite loop.
            if (result.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            result = regex.exec(line);
        }
        return positions;
    }
    getAllEndPositions(line, regex) {
        let positions = [];
        let result = regex.exec(line);
        while (result) {
            if (result[0].length) {
                positions.push(result.index + result[0].length - 1);
            }
            // Handles the case where an empty string match causes lastIndex not to advance,
            // which gets us in an infinite loop.
            if (result.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            result = regex.exec(line);
        }
        return positions;
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getWordLeftWithRegex(regex, inclusive = false) {
        for (let currentLine = this.line; currentLine >= 0; currentLine--) {
            let positions = this.getAllPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions.reverse(), index => ((index < this.character && !inclusive) ||
                (index <= this.character && inclusive)) || currentLine !== this.line);
            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter);
            }
        }
        return new Position(0, 0).getLineBegin();
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getWordRightWithRegex(regex, inclusive = false) {
        for (let currentLine = this.line; currentLine < textEditor_1.TextEditor.getLineCount(); currentLine++) {
            let positions = this.getAllPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions, index => ((index > this.character && !inclusive) ||
                (index >= this.character && inclusive)) || currentLine !== this.line);
            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter);
            }
        }
        return new Position(textEditor_1.TextEditor.getLineCount() - 1, 0).getLineEnd();
    }
    getLastWordEndWithRegex(regex) {
        for (let currentLine = this.line; currentLine < textEditor_1.TextEditor.getLineCount(); currentLine++) {
            let positions = this.getAllEndPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let index = _.findIndex(positions, index => index >= this.character || currentLine !== this.line);
            let newCharacter = 0;
            if (index === -1) {
                newCharacter = positions[positions.length - 1];
            }
            else if (index > 0) {
                newCharacter = positions[index - 1];
            }
            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter);
            }
        }
        return new Position(textEditor_1.TextEditor.getLineCount() - 1, 0).getLineEnd();
    }
    /**
     * Inclusive is true if we consider the current position a valid result, false otherwise.
     */
    getCurrentWordEndWithRegex(regex, inclusive) {
        for (let currentLine = this.line; currentLine < textEditor_1.TextEditor.getLineCount(); currentLine++) {
            let positions = this.getAllEndPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(positions, index => ((index > this.character && !inclusive) ||
                (index >= this.character && inclusive)) || currentLine !== this.line);
            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter);
            }
        }
        return new Position(textEditor_1.TextEditor.getLineCount() - 1, 0).getLineEnd();
    }
    getPreviousSentenceBeginWithRegex(regex, inclusive) {
        let paragraphBegin = this.getCurrentParagraphBeginning();
        for (let currentLine = this.line; currentLine >= paragraphBegin.line; currentLine--) {
            let endPositions = this.getAllEndPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(endPositions.reverse(), index => ((index < this.character && !inclusive
                && new Position(currentLine, index).getRightThroughLineBreaks().compareTo(this))
                || (index <= this.character && inclusive)) || currentLine !== this.line);
            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter).getRightThroughLineBreaks();
            }
        }
        if ((paragraphBegin.line + 1 === this.line || paragraphBegin.line === this.line)) {
            return paragraphBegin;
        }
        else {
            return new Position(paragraphBegin.line + 1, 0);
        }
    }
    getNextSentenceBeginWithRegex(regex, inclusive) {
        // A paragraph and section boundary is also a sentence boundary.
        let paragraphEnd = this.getCurrentParagraphEnd();
        for (let currentLine = this.line; currentLine <= paragraphEnd.line; currentLine++) {
            let endPositions = this.getAllEndPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, regex);
            let newCharacter = _.find(endPositions, index => ((index > this.character && !inclusive) ||
                (index >= this.character && inclusive)) || currentLine !== this.line);
            if (newCharacter !== undefined) {
                return new Position(currentLine, newCharacter).getRightThroughLineBreaks();
            }
        }
        // If the cursor is at an empty line, it's the end of a paragraph and the begin of another paragraph
        // Find the first non-whitepsace character.
        if (textEditor_1.TextEditor.getLineAt(new vscode.Position(this.line, 0)).text) {
            return paragraphEnd;
        }
        else {
            for (let currentLine = this.line; currentLine <= paragraphEnd.line; currentLine++) {
                let nonWhitePositions = this.getAllPositions(textEditor_1.TextEditor.getLineAt(new vscode.Position(currentLine, 0)).text, /\S/g);
                let newCharacter = _.find(nonWhitePositions, index => ((index > this.character && !inclusive) ||
                    (index >= this.character && inclusive)) || currentLine !== this.line);
                if (newCharacter !== undefined) {
                    return new Position(currentLine, newCharacter);
                }
            }
        }
    }
    findHelper(char, count, direction) {
        // -1 = backwards, +1 = forwards
        const line = textEditor_1.TextEditor.getLineAt(this);
        let index = this.character;
        while (count && index !== -1) {
            if (direction > 0) {
                index = line.text.indexOf(char, index + direction);
            }
            else {
                index = line.text.lastIndexOf(char, index + direction);
            }
            count--;
        }
        if (index > -1) {
            return new Position(this.line, index);
        }
        return null;
    }
    tilForwards(char, count = 1) {
        const position = this.findHelper(char, count, +1);
        if (!position) {
            return this;
        }
        return new Position(this.line, position.character - 1);
    }
    tilBackwards(char, count = 1) {
        const position = this.findHelper(char, count, -1);
        if (!position) {
            return this;
        }
        return new Position(this.line, position.character + 1);
    }
    findForwards(char, count = 1) {
        const position = this.findHelper(char, count, +1);
        if (!position) {
            return this;
        }
        return new Position(this.line, position.character);
    }
    findBackwards(char, count = 1) {
        const position = this.findHelper(char, count, -1);
        if (!position) {
            return this;
        }
        return position;
    }
}
Position.NonWordCharacters = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";
Position.NonBigWordCharacters = "";
exports.Position = Position;
//# sourceMappingURL=position.js.map