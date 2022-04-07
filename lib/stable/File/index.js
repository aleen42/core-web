/**
 * Patches for the `File()` constructor
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/File/File
 *   - https://github.com/eligrey/Blob.js/blob/master/Blob.js
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {File : win.File} : win;
    const WinBlob = win.Blob, {Blob} = await require('../Blob');

    // need to polyfill
    (() => {
        if (!target.File || WinBlob !== Blob) return 1;
    })() && polyfill();

    function polyfill() {
        function File(chunks, name, opts) {
            opts = opts || {};
            const a = Blob.call(this, chunks, opts) || this;
            a.name = name.replace(/\//g, ':');
            a.lastModifiedDate = opts.lastModified ? new Date(opts.lastModified) : new Date();
            a.lastModified = +a.lastModifiedDate;
            a[Symbol.toStringTag] = 'File';

            return a;
        }

        Object.assign(File.prototype = Object.create(Blob.prototype), {
            [Symbol.toStringTag] : 'File',
            constructor          : File,
            toString             : () => '[object File]',
        });

        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(File, Blob);
        } else {
            // eslint-disable-next-line no-proto
            try { File.__proto__ = Blob; } catch {}
        }

        target.File = File;
    }

    return _.pick(target, ['File']);
})(window)));
