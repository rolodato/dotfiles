"use strict";
const vscode = require("vscode");
const node = require("../node");
const error = require('../../error');
//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
class QuitCommand extends node.CommandBase {
    constructor(args) {
        super();
        this._name = 'quit';
        this._shortName = 'q';
        this._arguments = args;
    }
    get arguments() {
        return this._arguments;
    }
    execute() {
        if (this.activeTextEditor.document.isDirty && !this.arguments.bang) {
            throw error.VimError.fromCode(error.ErrorCode.E37);
        }
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }
}
exports.QuitCommand = QuitCommand;
//# sourceMappingURL=quit.js.map