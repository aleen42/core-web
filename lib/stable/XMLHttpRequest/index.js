/**
 * Patches for the `XMLHttpRequest()` constructor
 * REF:
 *   - https://github.com/eligrey/Blob.js/blob/master/Blob.js
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {XMLHttpRequest : win.XMLHttpRequest} : win;
    const WinBlob = win.Blob, {Blob} = await require('../Blob');
    const {TextDecoder} = await require('../../featured/Text');
    const textDecode = TextDecoder.prototype.decode.bind(new TextDecoder());
    // noinspection JSUnresolvedVariable
    const FormData = (await require('../FormData')).FormData;

    // need to patch
    (WinBlob !== Blob) && patch();

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

        if (FormData.prototype._blob && _send) {
            const setRequestHeader = target.XMLHttpRequest.prototype.setRequestHeader;

            target.XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
                setRequestHeader.call(this, name, value);
                if (name.toLowerCase() === 'content-type') this._hasContentType = true;
            };

            target.XMLHttpRequest.prototype.send = function (data) {
                // need to patch send b/c old IE don't send blob's type (#44)
                if (isIE) {
                    let isInstanceOfBlob;
                    try { isInstanceOfBlob = data instanceof Blob; } catch {}
                    isInstanceOfBlob && this.setRequestHeader('Content-Type', data.type);
                    _send.call(this, isInstanceOfBlob ? textDecode(data._buffer) : data);
                } else if (data instanceof FormData) {
                    const blob = data['_blob']();
                    if (!this._hasContentType) this.setRequestHeader('Content-Type', blob.type);
                    _send.call(this, blob);
                } else {
                    _send.call(this, data);
                }
            };
        }
    }

    return _.pick(target, ['XMLHttpRequest']);
})(window)));
