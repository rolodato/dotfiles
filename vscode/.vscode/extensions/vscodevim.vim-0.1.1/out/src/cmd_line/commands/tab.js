"use strict";
const vscode = require("vscode");
const node = require("../node");
(function (Tab) {
    Tab[Tab["Next"] = 0] = "Next";
    Tab[Tab["Previous"] = 1] = "Previous";
    Tab[Tab["First"] = 2] = "First";
    Tab[Tab["Last"] = 3] = "Last";
    Tab[Tab["New"] = 4] = "New";
    Tab[Tab["Close"] = 5] = "Close";
    Tab[Tab["Only"] = 6] = "Only";
})(exports.Tab || (exports.Tab = {}));
var Tab = exports.Tab;
//
//  Implements tab
//  http://vimdoc.sourceforge.net/htmldoc/tabpage.html
//
class TabCommand extends node.CommandBase {
    constructor(args) {
        super();
        this._name = 'tab';
        this._shortName = 'tab';
        this._arguments = args;
    }
    get arguments() {
        return this._arguments;
    }
    executeCommandWithCount(count, command) {
        if (!count) {
            count = 1;
        }
        for (let i = 0; i < count; i++) {
            vscode.commands.executeCommand(command);
        }
    }
    execute() {
        switch (this._arguments.tab) {
            case Tab.Next:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.nextEditor");
                break;
            case Tab.Previous:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.previousEditor");
                break;
            case Tab.First:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.openEditorAtIndex1");
                break;
            case Tab.Last:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.openLastEditorInGroup");
                break;
            case Tab.New:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.files.newUntitledFile");
                break;
            case Tab.Close:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.closeActiveEditor");
                break;
            case Tab.Only:
                this.executeCommandWithCount(this._arguments.count, "workbench.action.closeOtherEditors");
                break;
            default:
                break;
        }
    }
}
exports.TabCommand = TabCommand;
//# sourceMappingURL=tab.js.map