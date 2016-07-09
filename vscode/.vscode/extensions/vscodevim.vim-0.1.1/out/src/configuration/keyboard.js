"use strict";
const vscode = require("vscode");
class KeyboardLayout {
    constructor(mapper) {
        this._defaultKeyboardLayout = 'en-US (QWERTY)';
        this._mapper = mapper;
    }
    get name() {
        return this._mapper ? this._mapper.name : this._defaultKeyboardLayout;
    }
    translate(key) {
        return this._mapper ? this._mapper.get(key) : key;
    }
    static fromUserConfiguration() {
        const supportedKeyMappers = [
            new KeyMapperEsEsQwerty(),
            new KeyMapperDeDeQwertz(),
            new KeyMapperDaDKQwerty(),
            new KeyMapperSvSEQwerty(),
        ];
        let requestedKeyboardLayout = vscode.workspace.getConfiguration('vim').get("keyboardLayout", "");
        let keyboardLayout = supportedKeyMappers.find(layout => layout.name.toLowerCase() === requestedKeyboardLayout.toLowerCase());
        if (keyboardLayout) {
            return new KeyboardLayout(keyboardLayout);
        }
        else {
            return new KeyboardLayout();
        }
    }
}
exports.KeyboardLayout = KeyboardLayout;
class KeyMapperEsEsQwerty {
    constructor() {
        this._name = 'es-ES (QWERTY)';
        this._mappings = {
            '>': ':',
            '<': ';',
            '`': '<',
            '~': '>',
            ';': 'ñ',
            ':': 'Ñ',
            "'": "´",
            '\\': 'ç',
            '}': '*'
        };
    }
    get name() {
        return this._name;
    }
    get(key) {
        return this._mappings[key] || key;
    }
}
class KeyMapperDeDeQwertz {
    constructor() {
        this._name = 'de-DE (QWERTZ)';
        this._mappings = {
            '>': ':',
            '\\': '<',
            '<': ';',
            '^': '&'
        };
    }
    get name() {
        return this._name;
    }
    get(key) {
        return this._mappings[key] || key;
    }
}
class KeyMapperDaDKQwerty {
    constructor() {
        this._name = 'da-DK (QWERTY)';
        this._mappings = {
            '>': ':',
            '\\': '<',
            '<': ';',
            ':': '^',
            '^': '&'
        };
    }
    get name() {
        return this._name;
    }
    get(key) {
        return this._mappings[key] || key;
    }
}
class KeyMapperSvSEQwerty {
    constructor() {
        this._name = "sv-SE (QWERTY)";
        this._mappings = {
            'oem_102': '<',
            'shift+oem_102': '>',
            '>': ':',
            '<': ';',
            ':': '^',
            '^': '&'
        };
    }
    get name() {
        return this._name;
    }
    get(key) {
        return this._mappings[key] || key;
    }
}
//# sourceMappingURL=keyboard.js.map