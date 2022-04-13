// see https://github.com/inferpse/es3-harmony-webpack-plugin
const name = 'ES3HarmonyPlugin';

module.exports = class ES3HarmonyPlugin {
    apply({hooks, webpack : {javascript : {JavascriptModulesPlugin}}}) {
        // noinspection JSUnresolvedVariable
        hooks.compilation.tap({name}, compilation => {
            // noinspection JSUnresolvedVariable, JSUnresolvedFunction
            JavascriptModulesPlugin.getCompilationHooks(compilation).renderMain.tap({name}, replaceSource);
        });
    }
};

function replaceSource(source) {
    source = source['original'] ? source['original']() : source;
    if (source['getChildren']) {
        source['getChildren']().forEach(replaceSource);
    } else {
        // pattern: RegExp|substr, replacement: newSubstr|function
        replacements.forEach(([pattern, replacement]) => {
            if (pattern.test(source.source())) {
                source._value = source.source().replace(pattern, replacement);
            }
        });
    }
}

const toReplace = (pattern, replacement) => [
    new RegExp(pattern.trim()
            .replace(/.*noinspection.*\n/g, '')
            .replace(/[?.[\]()]/g, '\\$&')
            .replace(/\s+/g, '\\s*'), 'g'),
    // trimIndent
    replacement.trim().replace(/^ {8}/mg, ''),
];

/* global __webpack_require__ */// eslint-disable-line no-unused-vars
// language=JS
const replacements = [
    // @formatter:off
    toReplace(`
        __webpack_require__.d = function (exports, definition) {
            for (var key in definition) {
                // noinspection JSUnfilteredForInLoop, JSUnresolvedFunction
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
                    // noinspection JSUnfilteredForInLoop
                    Object.defineProperty(exports, key, { enumerable : true, get : definition[key] });
                }
            }
        };
    `, `
        __webpack_require__.d = function (exports, definition) {
            for (var key in definition) {
                // noinspection JSUnfilteredForInLoop, JSUnresolvedFunction
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
                    // noinspection JSUnfilteredForInLoop
                    exports[key] = definition[key](); // patched by ${name}
                }
            }
        };
    `),
    // @formatter:on

    // remove "use strict"
    [/(['"])use\s+strict(['"]);?/gm, ''],
];
