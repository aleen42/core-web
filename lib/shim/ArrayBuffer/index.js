/**
 * Shims for limited `ArrayBuffer` to implement `Uint8Array`
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {ArrayBuffer : win.ArrayBuffer} : win;

    // need to polyfill
    if (!target.ArrayBuffer) {
        target.ArrayBuffer = (await import(/* webpackChunkName: "array-buffer" */'./chunk.js')).default(win);
    }

    return target;
})(window)));
