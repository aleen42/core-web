module.exports = globalThis => {
    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('core-js/stable/dom-exception')).replaceAll('../..', 'core-js');
    return globalThis.DOMException;
};
