"use strict";
const mode_1 = require("./mode");
const mode_2 = require("./mode");
class EasyMotionMode extends mode_1.Mode {
    constructor() {
        super(mode_1.ModeName.EasyMotionMode);
        this.text = "EasyMotion Mode";
        this.cursorType = mode_2.VSCodeVimCursorType.Native;
    }
}
exports.EasyMotionMode = EasyMotionMode;
//# sourceMappingURL=modeEasyMotion.js.map