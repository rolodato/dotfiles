"use strict";
const node = require("../commands/quit");
const scanner_1 = require("../scanner");
const error_1 = require("../../error");
function parseQuitCommandArgs(args) {
    if (!args) {
        return new node.QuitCommand({});
    }
    var scannedArgs = {};
    var scanner = new scanner_1.Scanner(args);
    const c = scanner.next();
    if (c === '!') {
        scannedArgs.bang = true;
        scanner.ignore();
    }
    else if (c !== ' ') {
        throw error_1.VimError.fromCode(error_1.ErrorCode.E488);
    }
    scanner.skipWhiteSpace();
    if (!scanner.isAtEof) {
        throw error_1.VimError.fromCode(error_1.ErrorCode.E488);
    }
    return new node.QuitCommand(scannedArgs);
}
exports.parseQuitCommandArgs = parseQuitCommandArgs;
function parseQuitAllCommandArgs(args) {
    let command = parseQuitCommandArgs(args);
    command.arguments.quitAll = true;
    return command;
}
exports.parseQuitAllCommandArgs = parseQuitAllCommandArgs;
//# sourceMappingURL=quit.js.map