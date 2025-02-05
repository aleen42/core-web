/**
 * Patches for the `XMLHttpRequest()` constructor
 * REF:
 *   - https://github.com/eligrey/Blob.js/blob/master/Blob.js
 */
const IE8_DOM_DEFINE = require('core-js/internals/ie8-dom-define');

module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {XMLHttpRequest : win.XMLHttpRequest} : win;
    const {XMLHttpRequest} = target;
    const WinBlob = win.Blob, {Blob} = await require('../Blob');
    const {TextDecoder} = await require('../../featured/Text');
    const textDecode = TextDecoder.prototype.decode.bind(new TextDecoder());
    // noinspection JSUnresolvedVariable
    const FormData = (await require('../FormData')).FormData;
    const URLSearchParams = (await require('../URL')).URLSearchParams;

    // need to patch
    patch();

    function patch() {
        /**
         * Monkey patched
         * IE don't set Content-Type header on XHR whose body is a typed Blob
         * REF:
         *   - https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/send
         *   - https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/6047383
         */
        (_send => {
            const setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

            WinBlob !== Blob && (XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
                setRequestHeader.call(this, name, value);
                if (name.toLowerCase() === 'content-type') this._hasContentType = true;
            });

            XMLHttpRequest.prototype.send = function (data) {
                if (data instanceof URLSearchParams) {
                    // IE9 will throw "Invalid Params" when sending a `UrlSearchParams` object
                    try { _send.call(this, data); } catch { _send.call(this, data.toString()); }
                } else if (data instanceof Blob && data._buffer) {
                    // need to patch send b/c old IE don't send blob's type (#44)
                    if (!this._hasContentType) this.setRequestHeader('Content-Type', data.type);
                    _send.call(this, textDecode(data._buffer));
                } else if (data instanceof FormData && data._blob) {
                    const blob = data._blob();
                    if (!this._hasContentType) this.setRequestHeader('Content-Type', blob.type);
                    _send.call(this, blob);
                } else {
                    _send.call(this, data);
                }
            };
        })(XMLHttpRequest.prototype.send);

        // NOTE: HTTP Request methods like `CONNECT`, `PATCH`, `TRACE` are not supported under IE8-
        (_open => {
            XMLHttpRequest.prototype.open = function (method) {
                if (IE8_DOM_DEFINE && /^(connect|patch|trace)$/i.test(method)) {
                    throw new Error('Those methods are not supported under IE8');
                }
                return _open.apply(this, arguments);
            };
        })(XMLHttpRequest.prototype.open);

        // patch some constants
        XMLHttpRequest.DONE || _.assign(XMLHttpRequest, {
            UNSET            : 0,
            OPENED           : 1,
            HEADERS_RECEIVED : 2,
            LOADING          : 3,
            DONE             : 4,
        });
    }

    return {XMLHttpRequest};
})(window)));
