/**
 * Patches for the `URL()` constructor
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
 *   - https://github.com/mdn/browser-compat-data/pull/14506
 *   - https://github.com/mdn/browser-compat-data/pull/13820
 */

const extend = require('util/extend');

(win => {
    win.URL && /* need to patch */ (() => {
        if (new URL('', 'http://www.test.com?sid=1').searchParams.get('sid') !== '1') return true;
        try { new URL('file://C:/test.png') } catch { return true; }
    })() && (win.URL = extend(URL, (Fn, context, args) => {
        const [base, ...remain] = args;

        /**
         * 1. `new URL('file://C:/')` throws error in Chrome under MacOS
         *    REF: https://github.com/mdn/browser-compat-data/pull/14506
         * 2. keep query arguments under old Edge
         *    REF: https://github.com/mdn/browser-compat-data/pull/13820
         */
        return Fn.apply(this, [base ? base.replace(/^(file:\/\/)(\w)/, '$1/$2') : location, ...remain]);
    }));
})(window);
