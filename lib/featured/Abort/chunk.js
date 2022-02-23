module.exports = self => {
    /** @see build/EmbedSourceLoader.js */
    _['@@embed-source'](require('abortcontroller-polyfill'));
    return self;
};
