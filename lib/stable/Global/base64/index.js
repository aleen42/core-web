/**
 * Patches for `atob()` and `btoa()`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/atob
 *   - https://developer.mozilla.org/en-US/docs/Web/API/btoa
 *   - https://github.com/MaxArt2501/base64-js/blob/master/base64.js
 */

module.exports = (win => {
    // calling `target.atob` will throw "TypeError: Illegal invocation" under Chrome when directly pass `win.atob`
    const target = process.env['TEST_ENV'] ? {atob : s => win.atob(s), btoa : s => win.btoa(s)} : win;

    // need to polyfill
    !win.atob && polyfill();

    // need to patch
    (() => {
        /**
         * Some browsers' implementation of atob doesn't support whitespaces
         * in the encoded string (notably, IE). This wraps the native atob
         * in a function that strips the whitespaces.
         */
        try {
            target.atob(' ');
        } catch (e) { return 1; }
    })() && (target.atob = _.overwrite(target.atob, (Fn, context, args) =>
        Fn.call(context, `${args[0]}`.replace(/[\t\n\f\r ]+/g, ''))));

    function polyfill() {
        // base64 character set, plus padding character (=)
        const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        // Regular expression to check formal correctness of base64 encoded strings
        const b64re = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;

        const lantin = str => str.split('').every(ch => ch.charCodeAt(0) <= 255);

        target.btoa = string => {
            string = String(string);

            if (!lantin(string)) {
                throw new TypeError('Failed to execute \'btoa\' on \'Window\': '
                                    + 'The string to be encoded contains characters outside of the Latin1 range.');
            }

            let bitmap, a, b, c, result = '', i = 0;
            // To determine the final padding
            const rest = string.length % 3;

            for (; i < string.length;) {
                a = string.charCodeAt(i++);
                b = string.charCodeAt(i++);
                c = string.charCodeAt(i++);

                bitmap = (a << 16) | (b << 8) | c;
                result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63)
                          + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
            }

            // If there's need of padding, replace the last 'A's with equal signs
            return rest ? result.slice(0, rest - 3) + '==='.substring(rest) : result;
        };

        target.atob = string => {
            /**
             * atob can work with strings with whitespaces, even inside the encoded part,
             * but only \t, \n, \f, \r and ' ', which can be stripped.
             */
            string = String(string).replace(/[\t\n\f\r ]+/g, '');

            if (!lantin(string)) {
                throw new TypeError('Failed to execute \'atob\' on \'Window\': '
                                    + 'The string to be decoded contains characters outside of the Latin1 range.');
            }

            if (!b64re.test(string)) {
                throw new TypeError('Failed to execute \'atob\' on \'Window\': '
                                    + 'The string to be decoded is not correctly encoded.');
            }

            // Adding the padding if missing, for semplicity
            string += '=='.slice(2 - (string.length & 3));
            let bitmap, result = '', r1, r2, i = 0;
            for (; i < string.length;) {
                bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
                         | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));

                result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
                    : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
                        : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
            }
            return result;
        };
    }

    return target;
})(window);
