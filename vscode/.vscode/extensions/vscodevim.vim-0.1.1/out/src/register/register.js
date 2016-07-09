"use strict";
/**
 * There are two different modes of copy/paste in Vim - copy by character
 * and copy by line. Copy by line typically happens in Visual Line mode, but
 * also shows up in some other actions that work over lines (most noteably dd,
 * yy).
 */
(function (RegisterMode) {
    RegisterMode[RegisterMode["FigureItOutFromCurrentMode"] = 0] = "FigureItOutFromCurrentMode";
    RegisterMode[RegisterMode["CharacterWise"] = 1] = "CharacterWise";
    RegisterMode[RegisterMode["LineWise"] = 2] = "LineWise";
})(exports.RegisterMode || (exports.RegisterMode = {}));
var RegisterMode = exports.RegisterMode;
;
class Register {
    /**
     * Puts content in a register. If none is specified, uses the default
     * register ".
     */
    static put(content, vimState) {
        const register = vimState.registerName;
        if (Register.validRegisters.indexOf(register) === -1) {
            throw new Error(`Invalid register ${register}`);
        }
        Register.registers[register] = {
            text: content,
            registerMode: vimState.effectiveRegisterMode(),
        };
    }
    /**
     * Gets content from a register. If none is specified, uses the default
     * register ".
     */
    static get(vimState) {
        const register = vimState.registerName;
        if (Register.validRegisters.indexOf(register) === -1) {
            throw new Error(`Invalid register ${register}`);
        }
        return Register.registers[register];
    }
}
Register.validRegisters = [
    '"'
];
Register.registers = {
    '"': { text: "", registerMode: RegisterMode.CharacterWise }
};
exports.Register = Register;
//# sourceMappingURL=register.js.map