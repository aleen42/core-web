module.exports = globalThis => {
    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('core-js/modules/es.data-view')).replaceAll('..', 'core-js');
    return globalThis.DataView;
};
