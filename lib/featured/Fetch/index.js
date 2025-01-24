/**
 * Patches for Fetch APIs, including the `Headers`, `Request` and `Response` interfaces.
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Headers
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Request
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Response
 */

module.exports = new Promise(resolve => resolve((async win => {
    const keys = ['fetch', 'Headers', 'Request', 'Response'];
    const target = process.env['TEST_ENV'] ? _.pick(win, keys) : win;
    // noinspection JSUnresolvedVariable
    const FormData = (await require('../../stable/FormData')).FormData;

    if (keys.some(key => !win[key])) {
        Object.assign(target, _.pick((await import(/* webpackChunkName: "fetch" */'./chunk.js')).default({
            // polyfill requirements
            FormData,
            ...await require('../../stable/Blob'),
            ...await require('../../stable/FileReader'),
            ...await require('../../stable/Event'),
            ...await require('../../stable/XMLHttpRequest'),
            ...await require('../../stable/DOMException'),
            URLSearchParams : (await require('../../stable/URL')).URLSearchParams,

            ArrayBuffer,
            Symbol,
        }), keys));
    }

    if (FormData.prototype._blob) {
        // patch `fetch()` with `FormData` polyfill
        (fn => (target.fetch = function (input, init) {
            if (init && init.body && init.body instanceof FormData) {
                init.body = init.body['_blob']();
            }

            return fn.call(this, input, init);
        }))(target.fetch);
    }

    return _.pick(target, keys);
})(window)));
