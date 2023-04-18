// noinspection JSUnusedLocalSymbols
module.exports = (self, Symbol, Reflect, Proxy) => {
    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('abortcontroller-polyfill'));
    return self;
};
