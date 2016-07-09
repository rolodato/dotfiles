"use strict";
const vscode = require("vscode");
const node = require("../node");
const error = require("../../error");
class WriteQuitCommand extends node.CommandBase {
    constructor(args) {
        super();
        this._name = "writequit";
        this._shortName = "wq";
        this._arguments = args;
    }
    get arguments() {
        return this._arguments;
    }
    // Writing command. Taken as a basis from the "write.ts" file.
    execute(modeHandler) {
        var filename = new RegExp("Untitled-[0-9]*");
        if (!this.activeTextEditor.document.isDirty) {
            if (filename.test(this.activeTextEditor.document.fileName)) {
                vscode.commands.executeCommand("workbench.action.files.saveAs");
            }
            else {
                vscode.commands.executeCommand("workbench.action.files.save");
            }
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
        else {
            throw error.VimError.fromCode(error.ErrorCode.E208);
        }
    }
}
exports.WriteQuitCommand = WriteQuitCommand;
//# sourceMappingURL=writequit.js.map