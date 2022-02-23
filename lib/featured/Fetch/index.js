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

    if (keys.some(key => !win[key])) {
        Object.assign(target, _.pick((await import(/* webpackChunkName: "fetch" */'./chunk.js')).default({
            // polyfill requires the `Blob` and `FileReader`
            ...await import('../../stable/Blob'),
            ...await import('../../stable/FileReader'),
        }), keys));
    }

    return target;
})(window)));
