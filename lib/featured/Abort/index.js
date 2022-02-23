/**
 * Patches for `AbortController` and `AbortSignal`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
 *   - https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
 */

module.exports = new Promise(resolve => resolve((async win => {
    const keys = ['fetch', 'Request', 'AbortController', 'AbortSignal'];
    const target = process.env['TEST_ENV'] ? _.pick(win, keys) : win;

    if (!win.AbortController || !win.AbortSignal) {
        Object.assign(target, _.pick((await import(/* webpackChunkName: "abort-controller" */'./chunk.js')).default(
            // polyfill requires the `fetch()` and `Request`
            _.pick(await import('../Fetch'), keys)
        ), keys));
    }

    return target;
})(window)));
