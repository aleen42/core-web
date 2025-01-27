// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line no-unused-vars
const IE8_DOM_DEFINE = require('core-js/internals/ie8-dom-define');

module.exports = (Uint8Array, ArrayBuffer) => {
    const module = {exports : {}};
    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('text-encoding/lib/encoding.js'))
        .replace('require("./encoding-indexes.js")', 'require("text-encoding/lib/encoding-indexes.js")')
        .replace(/if \((!?)Object\.defineProperty\)/g, 'if ($1(Object.defineProperty && !IE8_DOM_DEFINE))');
    return module.exports;
};
