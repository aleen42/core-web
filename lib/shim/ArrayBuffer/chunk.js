module.exports = globalThis => {
    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('core-js/modules/es.array-buffer.constructor')).replaceAll('..', 'core-js');
    return globalThis.ArrayBuffer;
};
