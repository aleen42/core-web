module.exports = (self, Symbol, Reflect, Proxy) => {
    /** @see build/EmbedSourceLoader.js */
    _['@@embed-source'](require('abortcontroller-polyfill'));
    return self;
};
