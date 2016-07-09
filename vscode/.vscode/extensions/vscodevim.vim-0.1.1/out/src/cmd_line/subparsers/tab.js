"use strict";
const node = require("../commands/tab");
const scanner_1 = require('../scanner');
function parseCount(args) {
    if (!args) {
        return 1;
    }
    let scanner = new scanner_1.Scanner(args);
    scanner.skipWhiteSpace();
    if (scanner.isAtEof) {
        return 1;
    }
    let c = scanner.next();
    let count = Number.parseInt(c);
    if (Number.isInteger(count) && count > 0) {
        if (count > 999) {
            count = 999;
        }
        return count;
    }
    else {
        throw new Error(`Invalid tab number: ${c}!`);
    }
}
function parseTabNCommandArgs(args) {
    return new node.TabCommand({
        tab: node.Tab.Next,
        count: parseCount(args)
    });
}
exports.parseTabNCommandArgs = parseTabNCommandArgs;
function parseTabPCommandArgs(args) {
    return new node.TabCommand({
        tab: node.Tab.Previous,
        count: parseCount(args)
    });
}
exports.parseTabPCommandArgs = parseTabPCommandArgs;
function parseTabFirstCommandArgs(args) {
    return new node.TabCommand({
        tab: node.Tab.First
    });
}
exports.parseTabFirstCommandArgs = parseTabFirstCommandArgs;
function parseTabLastCommandArgs(args) {
    return new node.TabCommand({
        tab: node.Tab.Last
    });
}
exports.parseTabLastCommandArgs = parseTabLastCommandArgs;
function parseTabNewCommandArgs(args) {
    // New Tab command should support `count`
    // And the new created Tab's position depends on `count`
    // For now VS Code only allows open tab next to current Tab
    // So `count == 0` is not possible. But we can workaround this once we can move tabs through API.
    return new node.TabCommand({
        tab: node.Tab.New
    });
}
exports.parseTabNewCommandArgs = parseTabNewCommandArgs;
function parseTabCloseCommandArgs(args) {
    return new node.TabCommand({
        tab: node.Tab.Close
    });
}
exports.parseTabCloseCommandArgs = parseTabCloseCommandArgs;
function parseTabOnlyCommandArgs(args) {
    return new node.TabCommand({
        tab: node.Tab.Only
    });
}
exports.parseTabOnlyCommandArgs = parseTabOnlyCommandArgs;
//# sourceMappingURL=tab.js.map