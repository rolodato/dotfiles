"use strict";
const vscode = require('vscode');
(function (Command) {
    // Enter insert mode
    Command[Command["InsertAtCursor"] = 1] = "InsertAtCursor";
    Command[Command["InsertAtLineBegin"] = 2] = "InsertAtLineBegin";
    Command[Command["InsertAfterCursor"] = 3] = "InsertAfterCursor";
    Command[Command["InsertAtLineEnd"] = 4] = "InsertAtLineEnd";
    Command[Command["InsertNewLineBelow"] = 5] = "InsertNewLineBelow";
    Command[Command["InsertNewLineAbove"] = 6] = "InsertNewLineAbove";
    // Movement
    Command[Command["MoveUp"] = 7] = "MoveUp";
    Command[Command["MoveDown"] = 8] = "MoveDown";
    Command[Command["MoveLeft"] = 9] = "MoveLeft";
    Command[Command["MoveRight"] = 10] = "MoveRight";
    Command[Command["MoveLineBegin"] = 11] = "MoveLineBegin";
    Command[Command["MoveLineEnd"] = 12] = "MoveLineEnd";
    Command[Command["MoveWordBegin"] = 13] = "MoveWordBegin";
    Command[Command["MoveWordEnd"] = 14] = "MoveWordEnd";
    Command[Command["MoveFullWordBegin"] = 15] = "MoveFullWordBegin";
    Command[Command["MoveFullWordEnd"] = 16] = "MoveFullWordEnd";
    Command[Command["MoveLastWord"] = 17] = "MoveLastWord";
    Command[Command["MoveLastFullWord"] = 18] = "MoveLastFullWord";
    Command[Command["MoveLastWordEnd"] = 19] = "MoveLastWordEnd";
    Command[Command["MoveLastFullWordEnd"] = 20] = "MoveLastFullWordEnd";
    // MoveHalfPageUp,
    // MoveHalfPageDown,
    Command[Command["MoveFullPageUp"] = 21] = "MoveFullPageUp";
    Command[Command["MoveFullPageDown"] = 22] = "MoveFullPageDown";
    // MoveFirstLine,
    // MoveLastLine,
    Command[Command["MoveParagraphBegin"] = 23] = "MoveParagraphBegin";
    Command[Command["MoveParagraphEnd"] = 24] = "MoveParagraphEnd";
    Command[Command["MoveNonBlank"] = 25] = "MoveNonBlank";
    Command[Command["MoveNonBlankFirst"] = 26] = "MoveNonBlankFirst";
    Command[Command["MoveNonBlankLast"] = 27] = "MoveNonBlankLast";
    Command[Command["MoveMatchingBracket"] = 28] = "MoveMatchingBracket";
    // Find
    Command[Command["Find"] = 29] = "Find";
    // Folding
    Command[Command["Fold"] = 30] = "Fold";
    Command[Command["Unfold"] = 31] = "Unfold";
    Command[Command["FoldAll"] = 32] = "FoldAll";
    Command[Command["UnfoldAll"] = 33] = "UnfoldAll";
    // Text Modification
    Command[Command["Undo"] = 34] = "Undo";
    Command[Command["Redo"] = 35] = "Redo";
    Command[Command["Copy"] = 36] = "Copy";
    Command[Command["Paste"] = 37] = "Paste";
    Command[Command["ChangeWord"] = 38] = "ChangeWord";
    Command[Command["ChangeFullWord"] = 39] = "ChangeFullWord";
    Command[Command["ChangeCurrentWord"] = 40] = "ChangeCurrentWord";
    Command[Command["ChangeCurrentWordToNext"] = 41] = "ChangeCurrentWordToNext";
    Command[Command["ChangeToLineEnd"] = 42] = "ChangeToLineEnd";
    Command[Command["ChangeChar"] = 43] = "ChangeChar";
    Command[Command["DeleteLine"] = 44] = "DeleteLine";
    Command[Command["DeleteToNextWord"] = 45] = "DeleteToNextWord";
    Command[Command["DeleteToFullNextWord"] = 46] = "DeleteToFullNextWord";
    Command[Command["DeleteToWordEnd"] = 47] = "DeleteToWordEnd";
    Command[Command["DeleteToFullWordEnd"] = 48] = "DeleteToFullWordEnd";
    Command[Command["DeleteToWordBegin"] = 49] = "DeleteToWordBegin";
    Command[Command["DeleteToFullWordBegin"] = 50] = "DeleteToFullWordBegin";
    Command[Command["DeleteToLineEnd"] = 51] = "DeleteToLineEnd";
    Command[Command["DeleteChar"] = 52] = "DeleteChar";
    Command[Command["DeleteLastChar"] = 53] = "DeleteLastChar";
    Command[Command["Indent"] = 54] = "Indent";
    Command[Command["Outdent"] = 55] = "Outdent";
    // Misc
    Command[Command["EnterVisualMode"] = 56] = "EnterVisualMode";
    Command[Command["EnterCommand"] = 57] = "EnterCommand";
    Command[Command["ExitMessages"] = 58] = "ExitMessages";
})(exports.Command || (exports.Command = {}));
var Command = exports.Command;
class CommandKeyMap {
    constructor(normalModeKeyMap, insertModeKeyMap, visualModeKeyMap) {
        this.normalModeKeyMap = normalModeKeyMap;
        this.insertModeKeyMap = insertModeKeyMap;
        this.visualModeKeyMap = visualModeKeyMap;
    }
    static fromUserConfiguration() {
        let getConfig = function (keyHandlers, configName) {
            let overrides = vscode.workspace.getConfiguration("vim")
                .get(configName, keyHandlers);
            // merge
            for (let key in overrides) {
                if (overrides.hasOwnProperty(key)) {
                    keyHandlers[key] = overrides[key];
                }
            }
            return keyHandlers;
        };
        let normalMode = getConfig(CommandKeyMap.DefaultNormalKeyMap(), "normalModeKeyBindings");
        let insertMode = getConfig(CommandKeyMap.DefaultInsertKeyMap(), "insertModeKeyBindings");
        let visualMode = getConfig(CommandKeyMap.DefaultVisualKeyMap(), "visualModeKeyBindings");
        return new CommandKeyMap(normalMode, insertMode, visualMode);
    }
    static DefaultNormalKeyMap() {
        return {
            "h": Command.MoveLeft,
            "j": Command.MoveDown,
            "k": Command.MoveUp,
            "l": Command.MoveRight,
            "0": Command.MoveLineBegin,
            "$": Command.MoveLineEnd,
            "^": Command.MoveNonBlank,
            "gg": Command.MoveNonBlankFirst,
            "G": Command.MoveNonBlankLast,
            "w": Command.MoveWordBegin,
            "W": Command.MoveFullWordBegin,
            "e": Command.MoveWordEnd,
            "E": Command.MoveLastFullWordEnd,
            "ge": Command.MoveLastWordEnd,
            "gE": Command.MoveLastFullWordEnd,
            "b": Command.MoveLastWord,
            "B": Command.MoveLastFullWord,
            "{": Command.MoveParagraphBegin,
            "}": Command.MoveParagraphEnd,
            "%": Command.MoveMatchingBracket,
            ">>": Command.Indent,
            "<<": Command.Outdent,
            "u": Command.Undo,
            "ctrl+r": Command.Redo,
            "yy": Command.Copy,
            "p": Command.Paste,
            "cw": Command.ChangeWord,
            "cW": Command.ChangeFullWord,
            "ciw": Command.ChangeCurrentWord,
            "caw": Command.ChangeCurrentWordToNext,
            "C": Command.ChangeToLineEnd,
            "s": Command.ChangeChar,
            "dd": Command.DeleteLine,
            "dw": Command.DeleteToNextWord,
            "dW": Command.DeleteToFullNextWord,
            "db": Command.DeleteToWordBegin,
            "dB": Command.DeleteToFullWordBegin,
            "de": Command.DeleteToWordEnd,
            "dE": Command.DeleteToFullWordEnd,
            "D": Command.DeleteToLineEnd,
            "x": Command.DeleteChar,
            "X": Command.DeleteLastChar,
            "/": Command.Find,
            "zc": Command.Fold,
            "zo": Command.Unfold,
            "zC": Command.FoldAll,
            "zO": Command.UnfoldAll,
            ":": Command.EnterCommand,
            "v": Command.EnterVisualMode,
            "esc": Command.ExitMessages
        };
    }
    static DefaultInsertKeyMap() {
        return {
            "i": Command.InsertAtCursor,
            "I": Command.InsertAtLineBegin,
            "a": Command.InsertAfterCursor,
            "A": Command.InsertAtLineEnd,
            "o": Command.InsertNewLineBelow,
            "O": Command.InsertNewLineAbove,
        };
    }
    static DefaultVisualKeyMap() {
        return {
            "v": Command.EnterVisualMode
        };
    }
}
exports.CommandKeyMap = CommandKeyMap;
//# sourceMappingURL=commandKeyMap.js.map