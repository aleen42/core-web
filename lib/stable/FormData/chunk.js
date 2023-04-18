module.exports = globalThis => {
    // eslint-disable-next-line no-unused-vars
    const Blob = globalThis.Blob;
    // eslint-disable-next-line no-unused-vars
    const File = globalThis.File;
    // eslint-disable-next-line no-unused-vars
    const FormData = globalThis.FormData;

    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('formdata-polyfill/FormData'));
    return globalThis;
};
