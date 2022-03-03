module.exports = globalThis => {
    // eslint-disable-next-line no-unused-vars
    const Blob = globalThis.Blob;
    // eslint-disable-next-line no-unused-vars
    const FileReader = globalThis.FileReader;
    // eslint-disable-next-line no-unused-vars
    const FormData = globalThis.FormData;
    // eslint-disable-next-line no-unused-vars
    const URLSearchParams = globalThis.URLSearchParams;
    // eslint-disable-next-line no-unused-vars
    const AbortController = globalThis.AbortController;
    // eslint-disable-next-line no-unused-vars
    const XMLHttpRequest = globalThis.XMLHttpRequest;

    /** @see build/EmbedSourceLoader.js */
    _['@@embed-source'](require('whatwg-fetch'));
    return globalThis;
};
