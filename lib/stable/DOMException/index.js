/**
 * Polyfills for `DOMException` and its constructor
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/DOMException
 *   - https://developer.mozilla.org/en-US/docs/Web/API/DOMException/DOMException
 */

module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {DOMException : win.DOMException} : win;

    // need to polyfill
    if (!target.DOMException) {
        target.DOMException = (await import(/* webpackChunkName: "dom-exception" */'./chunk.js')).default(win);
    }

    return target;
})(window)));
