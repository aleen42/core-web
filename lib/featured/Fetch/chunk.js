// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line no-unused-vars
const IE8_DOM_DEFINE = require('core-js/internals/ie8-dom-define');

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
    // eslint-disable-next-line no-unused-vars
    const Uint8Array = globalThis.Uint8Array;
    // eslint-disable-next-line no-unused-vars
    const ArrayBuffer = globalThis.ArrayBuffer;

    // noinspection JSValidateJSDoc
    /** @see import('build/EmbedSourceLoader.js') */
    _['@@embed-source'](require('whatwg-fetch'))
        .replace('      xhr.onload = function() {', `
      IE8_DOM_DEFINE && (xhr.onreadystatechange = function () {
        xhr.readyState === XMLHttpRequest.DONE && xhr.onload()
      })

       xhr.onload = function () {`)
        .replace('isDataView(body)', '(isDataView(body) || (body instanceof Uint8Array))');
    return globalThis;
};
