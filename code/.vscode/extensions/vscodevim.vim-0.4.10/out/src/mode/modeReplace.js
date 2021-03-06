"use strict";
const mode_1 = require("./mode");
const mode_2 = require("./mode");
class ReplaceMode extends mode_1.Mode {
    constructor() {
        super(mode_1.ModeName.Replace);
        this.text = "Replace";
        this.cursorType = mode_2.VSCodeVimCursorType.TextDecoration;
    }
}
exports.ReplaceMode = ReplaceMode;
//# sourceMappingURL=modeReplace.js.map