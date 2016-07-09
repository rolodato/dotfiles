'use strict';
var vscode_1 = require('vscode');
var os_1 = require('os');
function activate(context) {
    var config = vscode_1.workspace.getConfiguration('files');
    var controller = new FinalNewLineController(config);
    context.subscriptions.push(controller);
}
exports.activate = activate;
var FinalNewLineController = (function () {
    function FinalNewLineController(config) {
        this._config = config;
        var subscriptions = [];
        vscode_1.workspace.onDidSaveTextDocument(this._onDocumentSaved, this, subscriptions);
        vscode_1.workspace.onDidChangeConfiguration(this._onConfigChanged, this, subscriptions);
        this._disposable = vscode_1.Disposable.from.apply(vscode_1.Disposable, subscriptions);
    }
    FinalNewLineController.prototype.dispose = function () {
        this._disposable.dispose();
    };
    FinalNewLineController.prototype._onDocumentSaved = function () {
        if (this._config.get('insertFinalNewline', false) === true) {
            this._insertFinalNewline();
        }
    };
    FinalNewLineController.prototype._onConfigChanged = function () {
        this._config = vscode_1.workspace.getConfiguration('files');
    };
    FinalNewLineController.prototype._insertFinalNewline = function () {
        if (!vscode_1.window.activeTextEditor) {
            return;
        }
        var doc = vscode_1.window.activeTextEditor.document;
        var lastLine = doc.lineAt(doc.lineCount - 1);
        if (lastLine.isEmptyOrWhitespace === false) {
            vscode_1.window.activeTextEditor.edit(function (editBuilder) {
                editBuilder.insert(new vscode_1.Position(doc.lineCount - 1, lastLine.text.length), os_1.EOL);
            }).then(function () { return doc.save(); });
        }
    };
    return FinalNewLineController;
})();
//# sourceMappingURL=extension.js.map