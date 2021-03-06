"use strict";
const range_1 = require("./../motion/range");
exports.isTextTransformation = (x) => {
    return x.type === 'insertText' ||
        x.type === 'replaceText' ||
        x.type === 'deleteText' ||
        x.type === 'moveCursor' ||
        x.type === 'deleteRange';
};
const getRangeFromTextTransformation = (transformation) => {
    switch (transformation.type) {
        case 'insertText':
            return new range_1.Range(transformation.position, transformation.position);
        case 'replaceText':
            return new range_1.Range(transformation.start, transformation.end);
        case 'deleteText':
            return new range_1.Range(transformation.position, transformation.position);
        case 'deleteRange':
            return transformation.range;
        case 'moveCursor':
            return undefined;
    }
    throw new Error("This should never happen!");
};
exports.areAnyTransformationsOverlapping = (transformations) => {
    for (let i = 0; i < transformations.length; i++) {
        for (let j = i + 1; j < transformations.length; j++) {
            const first = transformations[i];
            const second = transformations[j];
            const firstRange = getRangeFromTextTransformation(first);
            const secondRange = getRangeFromTextTransformation(second);
            if (!firstRange || !secondRange) {
                continue;
            }
            if (firstRange.overlaps(secondRange)) {
                return true;
            }
        }
    }
    return false;
};
//# sourceMappingURL=transformations.js.map