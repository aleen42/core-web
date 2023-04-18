/**
 * Patches for `Element.classList`
 * REF: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
 */

module.exports = new Promise(resolve => resolve((async win => {
    await import(/* webpackChunkName: "class-list" */'./chunk.js').default(win);
})(window)));
