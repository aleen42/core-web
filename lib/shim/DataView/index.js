/**
 * Shims for limited `DataView` to implement `Uint8Array`
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {DataView : win.DataView} : win;

    // need to polyfill
    if (!target.DataView) {
        target.DataView = (await import(/* webpackChunkName: "data-view" */'./chunk.js')).default(win);
    }

    return target;
})(window)));
