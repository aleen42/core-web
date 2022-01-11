/**
 * Patches for `Blob`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Blob
 *   - https://github.com/aleen42/PersonalWiki/issues/32#issuecomment-1003324816
 */

const extend = require('util/extend');

/* global MSBlobBuilder */
(win => {
    if (win.Blob) {
        try {
            new Blob([new Uint8Array(0)]);
        } catch (e) {
            // Patches for `Blob()` constructor under IE 10
            if (`${e}` === 'InvalidStateError') {
                win.Blob = extend(Blob, function (Fn, context, args) {
                    try {
                        return Fn.apply(context, args);
                    } catch (e) {
                        const arg = [].concat(args[0])[0];
                        const buffer = typeof arg === 'string' ? arg : arg.buffer;
                        if (win.MSBlobBuilder && buffer) {
                            const blobBuilder = new MSBlobBuilder();
                            blobBuilder.append(buffer);
                            return blobBuilder.getBlob();
                        }

                        // Throw the error again when cannot construct
                        throw e;
                    }
                });
            }
        }
    }
})(window);
