'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
/**
 * Extension.ts is a lightweight wrapper around ModeHandler. It converts key
 * events to their string names and passes them on to ModeHandler via
 * handleKeyEvent().
 */
const vscode = require('vscode');
const main_1 = require('./src/cmd_line/main');
const modeHandler_1 = require('./src/mode/modeHandler');
const taskQueue_1 = require('./src/taskQueue');
let extensionContext;
/**
 * Note: We can't initialize modeHandler here, or even inside activate(), because some people
 * see a bug where VSC hasn't fully initialized yet, which pretty much breaks VSCodeVim entirely.
 */
let modeHandlerToFilename = {};
let previousActiveFilename = undefined;
let taskQueue = new taskQueue_1.TaskQueue();
function activeFileName() {
    return vscode.window.activeTextEditor.document.fileName;
}
function getAndUpdateModeHandler() {
    return __awaiter(this, void 0, Promise, function* () {
        const oldHandler = modeHandlerToFilename[previousActiveFilename];
        if (!modeHandlerToFilename[activeFileName()]) {
            const newModeHandler = new modeHandler_1.ModeHandler(false, activeFileName());
            modeHandlerToFilename[activeFileName()] = newModeHandler;
            extensionContext.subscriptions.push(newModeHandler);
            console.log('make new mode handler for ', activeFileName());
        }
        const handler = modeHandlerToFilename[activeFileName()];
        if (previousActiveFilename !== activeFileName()) {
            previousActiveFilename = activeFileName();
            yield handler.updateView(handler.vimState);
        }
        if (oldHandler && oldHandler.vimState.focusChanged) {
            oldHandler.vimState.focusChanged = false;
            handler.vimState.focusChanged = true;
        }
        return handler;
    });
}
exports.getAndUpdateModeHandler = getAndUpdateModeHandler;
function activate(context) {
    extensionContext = context;
    registerCommand(context, 'type', (args) => __awaiter(this, void 0, void 0, function* () {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const mh = yield getAndUpdateModeHandler();
        taskQueue.enqueueTask({
            promise: () => __awaiter(this, void 0, void 0, function* () { yield mh.handleKeyEvent(args.text); }),
            isRunning: false
        });
    }));
    registerCommand(context, 'extension.vim_esc', () => handleKeyEvent("<esc>"));
    registerCommand(context, 'extension.vim_backspace', () => handleKeyEvent("<backspace>"));
    registerCommand(context, 'extension.vim_switchWindow', () => handleKeyEvent("ctrl+w"));
    registerCommand(context, 'extension.showCmdLine', () => {
        main_1.showCmdLine("", modeHandlerToFilename[activeFileName()]);
    });
    'rfb'.split('').forEach(key => {
        registerCommand(context, `extension.vim_ctrl+${key}`, () => handleKeyEvent(`ctrl+${key}`));
    });
    ['left', 'right', 'up', 'down'].forEach(key => {
        registerCommand(context, `extension.vim_${key}`, () => handleKeyEvent(`<${key}>`));
    });
}
exports.activate = activate;
function registerCommand(context, command, callback) {
    let disposable = vscode.commands.registerCommand(command, callback);
    context.subscriptions.push(disposable);
}
function handleKeyEvent(key) {
    return __awaiter(this, void 0, Promise, function* () {
        const mh = yield getAndUpdateModeHandler();
        taskQueue.enqueueTask({
            promise: () => __awaiter(this, void 0, void 0, function* () { yield mh.handleKeyEvent(key); }),
            isRunning: false
        });
    });
}
process.on('unhandledRejection', function (reason, p) {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
//# sourceMappingURL=extension.js.map