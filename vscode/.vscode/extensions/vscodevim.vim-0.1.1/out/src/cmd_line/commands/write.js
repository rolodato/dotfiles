"use strict";
// XXX: use graceful-fs ??
const fs = require('fs');
const path = require('path');
const node = require('../node');
const util = require('../../util');
const error = require('../../error');
//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
class WriteCommand extends node.CommandBase {
    constructor(args) {
        super();
        this._name = 'write';
        this._shortName = 'w';
        this._arguments = args;
    }
    get arguments() {
        return this._arguments;
    }
    execute(modeHandler) {
        if (this.arguments.opt) {
            util.showError("Not implemented.");
            return;
        }
        else if (this.arguments.file) {
            util.showError("Not implemented.");
            return;
        }
        else if (this.arguments.append) {
            util.showError("Not implemented.");
            return;
        }
        else if (this.arguments.cmd) {
            util.showError("Not implemented.");
            return;
        }
        if (this.activeTextEditor.document.isUntitled) {
            throw error.VimError.fromCode(error.ErrorCode.E32);
        }
        fs.access(this.activeTextEditor.document.fileName, fs.W_OK, (accessErr) => {
            if (accessErr) {
                if (this.arguments.bang) {
                    fs.chmod(this.activeTextEditor.document.fileName, 666, (e) => {
                        if (e) {
                            modeHandler.setupStatusBarItem(e.message);
                        }
                        else {
                            this.save(modeHandler);
                        }
                    });
                }
                else {
                    modeHandler.setupStatusBarItem(accessErr.message);
                }
            }
            else {
                this.save(modeHandler);
            }
        });
    }
    save(modeHandler) {
        this.activeTextEditor.document.save().then((ok) => {
            modeHandler.setupStatusBarItem('"' + path.basename(this.activeTextEditor.document.fileName) +
                '" ' + this.activeTextEditor.document.lineCount + 'L ' +
                this.activeTextEditor.document.getText().length + 'C written');
        }, (e) => modeHandler.setupStatusBarItem(e));
    }
}
exports.WriteCommand = WriteCommand;
//# sourceMappingURL=write.js.map