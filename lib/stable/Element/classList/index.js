/**
 * Patches for `Element.classList`
 * REF: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
 */

module.exports = new Promise(resolve => resolve((async win => {
    if (!('classList' in document.createElement('_'))
        || (document.createElementNS && !('classList' in document.createElementNS('http://www.w3.org/2000/svg', 'g')))
    ) {
        const classListProto = (await import(/* webpackChunkName: "class-list" */'./chunk.js')).default(win);
        (fn => (classListProto.contains = function () {
            // REF: https://github.com/eligrey/classList.js/issues/84
            return !!fn.apply(this, arguments);
        }))(classListProto.contains);
    }
})(window)));
