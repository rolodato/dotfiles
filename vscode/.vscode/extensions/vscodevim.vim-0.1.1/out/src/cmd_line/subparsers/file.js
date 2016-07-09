"use strict";
const node = require("../commands/file");
const scanner_1 = require('../scanner');
function parseEditFileCommandArgs(args) {
    if (!args) {
        return new node.FileCommand({});
    }
    var scanner = new scanner_1.Scanner(args);
    let name = scanner.nextWord();
    return new node.FileCommand({
        name: name
    });
}
exports.parseEditFileCommandArgs = parseEditFileCommandArgs;
//# sourceMappingURL=file.js.map