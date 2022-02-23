module.exports = globalThis => {
    /** @see build/EmbedSourceLoader.js */
    _['@@embed-source'](require('whatwg-fetch'));
    return globalThis;
};
