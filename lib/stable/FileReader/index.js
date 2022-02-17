/**
 * Patches for the `FileReader()` constructor
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/FileReader/FileReader
 *   - https://github.com/eligrey/Blob.js/blob/master/Blob.js
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {FileReader : win.FileReader} : win;
    const {btoa} = require('../Global/base64');
    const {Blob} = await require('../Blob');
    const {TextDecoder} = await require('../../featured/Text');
    const textDecode = TextDecoder.prototype.decode.bind(new TextDecoder());

    // need to polyfill
    (!target.FileReader || win.Blob !== Blob) && polyfill();

    // need to patch `Blob.prototype.arrayBuffer` and `Blob.prototype.text`
    // noinspection JSUnresolvedVariable
    (!Blob.prototype.arrayBuffer || !Blob.prototype.text) && patchBlobPrototype();

    function polyfill() {
        function FileReader() {
            if (!(this instanceof FileReader)) {
                // eslint-disable-next-line max-len
                throw new TypeError('Failed to construct \'FileReader\': Please use the \'new\' operator, this DOM object constructor cannot be called as a function.');
            }

            const delegate = document.createDocumentFragment();
            this.addEventListener = delegate.addEventListener;
            this.dispatchEvent = function (evt) {
                const local = this[`on${evt.type}`];
                if (_.isFUN(local)) local(evt);
                delegate.dispatchEvent(evt);
            };
            this.removeEventListener = delegate.removeEventListener;
        }

        function _read(self, blob, kind) {
            if (!(blob instanceof Blob)) {
                throw new TypeError(`Failed to execute '${kind}' on 'FileReader': parameter 1 is not of type 'Blob'.`);
            }

            self.result = '';

            setTimeout(() => {
                self.readyState = FileReader.LOADING;
                self.dispatchEvent(new Event('load'));
                self.dispatchEvent(new Event('loadend'));
            });
        }

        FileReader.EMPTY = 0;
        FileReader.LOADING = 1;
        FileReader.DONE = 2;

        // noinspection JSUnusedGlobalSymbols
        Object.assign(FileReader.prototype, {
            [Symbol.toStringTag] : 'FileReader',
            error                : null,
            onabort              : null,
            onerror              : null,
            onload               : null,
            onloadend            : null,
            onloadstart          : null,
            onprogress           : null,
            abort                : _.noop,

            readAsDataURL(blob) {
                const self = this;
                _read(self, blob, 'readAsDataURL');
                self.result = `data:${blob.type};base64,${btoa(String.fromCharCode(...(blob._buffer)))}`;
            },

            readAsText(blob) {
                const self = this;
                _read(self, blob, 'readAsText');
                self.result = textDecode(blob._buffer);
            },

            readAsArrayBuffer(blob) {
                const self = this;
                _read(self, blob, 'readAsText');
                // return ArrayBuffer when possible
                self.result = [...blob._buffer.buffer || blob._buffer];
            },
        });

        target.FileReader = FileReader;
    }

    function patchBlobPrototype() {
        const prototype = Blob.prototype;

        // noinspection JSUnresolvedVariable
        Object.assign(prototype, {
            arrayBuffer : prototype.arrayBuffer || function () {
                const fileReader = new FileReader();
                fileReader.readAsArrayBuffer(this);
                return promisify(fileReader);
            },

            text : prototype.text || function () {
                const fileReader = new FileReader();
                fileReader.readAsText(this);
                return promisify(fileReader);
            },
        });

        function promisify(obj) {
            return new Promise((resolve, reject) => {
                obj.onload = obj.onerror = evt => {
                    obj.onload = obj.onerror = null;
                    evt.type === 'load'
                        ? resolve(obj.result || obj)
                        : reject(new Error('Failed to read the blob/file'));
                };
            });
        }
    }

    return target;
})(window)));
