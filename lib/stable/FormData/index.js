/**
 * Patches for `FormData`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/FormData
 */
module.exports = new Promise(resolve => resolve((async win => {
    const keys = ['FormData'];
    const target = process.env['TEST_ENV'] ? {FormData : win.FormData} : win;
    if (!target.FormData
        || /* for some IE10 */ !_.isFUN(target.FormData)
        || /* for all IE */ !target.FormData.prototype.has
    ) {
        const polyfills = _.pick((await import(/* webpackChunkName: "form-data" */'./chunk.js')).default({
            ...await require('../Blob'),
            ...await require('../File'),
            Symbol,
            navigator,
            FormData : target.FormData,
            Element  : win.Element,
        }), keys);

        Object.assign(target, polyfills);
        return polyfills;
    }

    return _.pick(target, keys);
})(window)));
