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
        const polyfills = _.pick((await import(/* webpackChunkName: "abort-controller" */'./chunk.js')).default({
            // polyfill requires the `fetch()` and `Request`
            ..._.pick(await import('../Fetch'), keys),
        }, Symbol, win.Reflect, win.Proxy), keys);

        // patch the constructor `Request()`
        polyfills.Request = _.overwrite(polyfills.Request, function (Fn, context, args) {
            if (!(context instanceof Fn)) {
                // eslint-disable-next-line max-len
                throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
            }

            const [input, options = {}] = args;
            options.signal = options.signal || (() => (new polyfills.AbortController()).signal)();
            return new Fn(input, options);
        });

        Object.assign(target, polyfills);
        return polyfills;
    }

    return _.pick(target, keys);
})(window)));
