"use strict";
const quit_1 = require('./subparsers/quit');
const write_1 = require('./subparsers/write');
const writequit_1 = require('./subparsers/writequit');
const tabCmd = require('./subparsers/tab');
const fileCmd = require('./subparsers/file');
const substitute_1 = require('./subparsers/substitute');
// maps command names to parsers for said commands.
exports.commandParsers = {
    w: write_1.parseWriteCommandArgs,
    write: write_1.parseWriteCommandArgs,
    quit: quit_1.parseQuitCommandArgs,
    q: quit_1.parseQuitCommandArgs,
    wq: writequit_1.parseWriteQuitCommandArgs,
    writequit: writequit_1.parseWriteQuitCommandArgs,
    tabn: tabCmd.parseTabNCommandArgs,
    tabnext: tabCmd.parseTabNCommandArgs,
    tabp: tabCmd.parseTabPCommandArgs,
    tabprevious: tabCmd.parseTabPCommandArgs,
    tabfirst: tabCmd.parseTabFirstCommandArgs,
    tabfir: tabCmd.parseTabFirstCommandArgs,
    tablast: tabCmd.parseTabLastCommandArgs,
    tabl: tabCmd.parseTabLastCommandArgs,
    tabe: tabCmd.parseTabNewCommandArgs,
    tabedit: tabCmd.parseTabNewCommandArgs,
    tabnew: tabCmd.parseTabNewCommandArgs,
    tabclose: tabCmd.parseTabCloseCommandArgs,
    tabc: tabCmd.parseTabCloseCommandArgs,
    tabo: tabCmd.parseTabOnlyCommandArgs,
    tabonly: tabCmd.parseTabOnlyCommandArgs,
    e: fileCmd.parseEditFileCommandArgs,
    s: substitute_1.parseSubstituteCommandArgs
};
//# sourceMappingURL=subparser.js.map