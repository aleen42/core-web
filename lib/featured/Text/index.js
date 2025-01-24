/**
 * Patches for `TextEncoder` and `TextDecoder`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
 *   - https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
 */

module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV']
        ? {TextEncoder : win.TextEncoder, TextDecoder : win.TextDecoder}
        : win;
    if (!win.TextDecoder || !win.TextEncoder) {
        Object.assign(target, (await import(/* webpackChunkName: "text-encoding" */'./chunk.js')));
    }

    return target;
})(window)));
