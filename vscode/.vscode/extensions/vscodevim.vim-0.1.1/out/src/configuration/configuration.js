"use strict";
const commandKeyMap_1 = require('./commandKeyMap');
const keyboard_1 = require('./keyboard');
class Configuration {
    constructor(keyboard, keyMap) {
        this.keyboardLayout = keyboard;
        this.commandKeyMap = keyMap;
    }
    static fromUserFile() {
        return new Configuration(keyboard_1.KeyboardLayout.fromUserConfiguration(), commandKeyMap_1.CommandKeyMap.fromUserConfiguration());
    }
}
exports.Configuration = Configuration;
//# sourceMappingURL=configuration.js.map