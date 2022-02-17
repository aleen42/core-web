/**
 * Patches for the `XMLHttpRequest()` constructor
 * REF:
 *   - https://github.com/eligrey/Blob.js/blob/master/Blob.js
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {XMLHttpRequest : win.XMLHttpRequest} : win;
    const {Blob} = await require('../Blob');
    const {TextDecoder} = await require('../../featured/Text');
    const textDecode = TextDecoder.prototype.decode.bind(new TextDecoder());

    // need to patch
    (win.Blob !== Blob) && patch();

    function patch() {
        const isIE = require('detector').browser.name === 'ie';

        /**
         * Monkey patched
         * IE don't set Content-Type header on XHR whose body is a typed Blob
         * REF:
         *   - https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send
         *   - https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/6047383
         */
        const _send = target.XMLHttpRequest && target.XMLHttpRequest.prototype.send;
        if (isIE && _send) {
            // TODO: how to avoid polluting the native protocol when testing?
            Object.assign(target.XMLHttpRequest.prototype, {
                send(data) {
                    let isInstanceOfBlob;
                    try { isInstanceOfBlob = data instanceof Blob; } catch {}
                    isInstanceOfBlob && this.setRequestHeader('Content-Type', data.type);
                    _send.call(this, isInstanceOfBlob ? textDecode(data._buffer) : data);
                },
            });
        }
    }

    return target;
})(window)));
