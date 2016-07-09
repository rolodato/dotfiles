"use strict";
const vscode = require("vscode");
const path = require("path");
const node = require("../node");
class FileCommand extends node.CommandBase {
    constructor(args) {
        super();
        this._name = 'file';
        this._shortName = 'file';
        this._arguments = args;
    }
    get arguments() {
        return this._arguments;
    }
    execute() {
        let currentFilePath = vscode.window.activeTextEditor.document.uri.path;
        let newFilePath = path.join(path.dirname(currentFilePath), this._arguments.name);
        if (newFilePath !== currentFilePath) {
            let folder = vscode.Uri.file(newFilePath);
            vscode.commands.executeCommand("vscode.open", folder);
        }
    }
}
exports.FileCommand = FileCommand;
//# sourceMappingURL=file.js.map