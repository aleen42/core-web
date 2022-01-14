/**
 * Patches for `FormData`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/FormData
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {FormData : win.FormData} : win;
    if (!win.FormData || /* for IE10 */ !_.isFUN(win.FormData) || /* for IE11 */ (new win.FormData()).has == null) {
        win.Blob = win.Blob || (await require('../Blob')).Blob;
        await import(/* webpackChunkName: "form-data" */'formdata-polyfill');

        if (process.env['TEST_ENV']) {
            // avoid pollution on Window
            target.FormData = win.FormData;
            delete win.FormData;
        }
    }

    return target;
})(window)));
