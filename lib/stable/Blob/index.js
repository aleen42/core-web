/**
 * Patches for the `Blob()` constructor and `Blob.prototype.stream`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Blob/stream
 *   - https://github.com/aleen42/PersonalWiki/issues/32#issuecomment-1003324816
 *   - https://github.com/eligrey/Blob.js/blob/master/Blob.js
 *
 * Patches for `Blob.prototype.arrayBuffer` and `Blob.prototype.text`
 * @see FileReader
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer
 *   - https://developer.mozilla.org/en-US/docs/Web/API/Blob/text
 */

/* global MSBlobBuilder */
module.exports = new Promise(resolve => resolve((async win => {
    // necessary polyfill
    const {TextEncoder, TextDecoder} = await require('../../featured/Text');
    const {ReadableStream} = await require('../../featured/Streams');
    const target = process.env['TEST_ENV'] ? {Blob : win.Blob} : win;

    // need to polyfill
    (() => {
        if (!win.Blob || !_.isFUN(Blob)) return 1;

        try { new Blob(); } catch { return 1; }

        try {
            // noinspection JSValidateTypes
            Blob();
            return 1;
        } catch {}

        try {
            // Check if Blob constructor supports ArrayBufferViews
            // Fails in Safari 6, so we need to map to ArrayBuffers there.
            return new Blob([new Uint8Array([1, 2])]).size !== 2;
        } catch { return 1; }
    })() && polyfill();

    // need to patch
    (() => {
        try {
            new target.Blob([new Uint8Array(0)]);
            new target.Blob([null, true, false, 0, 1, 1.5, 'fail', {}]);
        } catch (e) {
            // Patches for `Blob()` constructor under IE10 / IE11
            return `${e}` === 'InvalidStateError';
        }
    })() && (target.Blob = _.overwrite(target.Blob, (Fn, context, args) => {
        try {
            return Fn.apply(context, args);
        } catch (e) {
            if (`${e}` === 'InvalidStateError') {
                if (win.MSBlobBuilder) {
                    const blobBuilder = new MSBlobBuilder();
                    [].concat(args[0]).forEach(arg => {
                        blobBuilder.append(arg != null && arg.buffer ? arg.buffer : arg);
                    });
                    return blobBuilder.getBlob();
                }
            }

            // Throw the error again when cannot construct
            throw e;
        }
    }));

    function polyfill() {
        // noinspection JSUnresolvedVariable
        const BlobBuilder = win.BlobBuilder || win.WebKitBlobBuilder || win.MSBlobBuilder || win.MozBlobBuilder;

        /**
         * Helper function that maps ArrayBufferViews to ArrayBuffers
         * Used by BlobBuilder constructor and old browsers that didn't
         * support it in the Blob constructor.
         */
        function mapArrayBufferViews(ary) {
            return _.map(ary, chunk => {
                if (chunk != null && chunk.buffer instanceof ArrayBuffer) {
                    let buf = chunk.buffer;

                    /**
                     * if this is a subarray, make a copy so we only
                     * include the subarray region from the underlying buffer
                     */
                    if (chunk.byteLength !== buf.byteLength) {
                        const copy = new Uint8Array(chunk.byteLength);
                        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
                        buf = copy.buffer;
                    }

                    return buf;
                }

                return chunk;
            });
        }

        function validateArgs(ary, options, Fn) {
            let isInstanceOfBlob;
            try { isInstanceOfBlob = this instanceof Fn; } catch {
                // IE 8 throws an error when using instanceof
            }

            if (isInstanceOfBlob === false) {
                // eslint-disable-next-line max-len
                throw new TypeError('Failed to construct \'Blob\': Please use the \'new\' operator, this DOM object constructor cannot be called as a function.');
            }

            if (ary !== void 0 && (typeof ary !== 'object' || ary === null)) {
                // eslint-disable-next-line max-len
                throw new TypeError('Failed to construct \'Blob\': The provided value cannot be converted to a sequence.');
            }

            if (ary !== void 0 && !_.isIterable(ary)) {
                // eslint-disable-next-line max-len
                throw new TypeError('Failed to construct \'Blob\': The object must have a callable @@iterator property.');
            }

            if (options !== void 0 && typeof options !== 'object') {
                // eslint-disable-next-line max-len
                throw new TypeError('Failed to construct \'Blob\': The provided value is not of type \'BlobPropertyBag\'.');
            }
        }

        function BlobBuilderConstructor(...args) {
            const [ary, options] = args;
            validateArgs.call(this, ary, options, BlobBuilderConstructor);
            const blobBuilder = new BlobBuilder();
            mapArrayBufferViews(ary).forEach(part => { blobBuilder.append(part); });
            return (options || 0).type ? blobBuilder.getBlob(options.type) : blobBuilder.getBlob();
        }

        const OriginalBlob = win.Blob;
        function BlobConstructor(...args) {
            const [ary, options] = args;
            validateArgs.call(this, ary, options, BlobConstructor);
            return new OriginalBlob(mapArrayBufferViews(ary), options || {});
        }

        if (OriginalBlob) {
            BlobBuilderConstructor.prototype = OriginalBlob.prototype;
            BlobConstructor.prototype = OriginalBlob.prototype;
        }

        // string -> buffer
        const textEncode = TextEncoder.prototype.encode.bind(new TextEncoder());
        // buffer -> string
        const textDecode = TextDecoder.prototype.decode.bind(new TextDecoder());

        function FakeBlobBuilder() {
            function bufferClone(buf) {
                const view = new Array(buf.byteLength);
                const array = new Uint8Array(buf);
                let i = view.length;
                while (i--) { view[i] = array[i]; }
                return view;
            }

            function toBuffer(chunks) {
                if (win.Uint8Array) {
                    const b = new Uint8Array(_.sumBy(chunks, 'length'));
                    let offset = 0;
                    chunks.forEach(chunk => {
                        b.set(chunk, offset);
                        offset += chunk.byteLength || chunk.length;
                    });
                    return b;
                } else {
                    return [].concat.apply([], chunks);
                }
            }

            const isArrayBufferView = ArrayBuffer.isView || (obj => obj && [
                '[object Int8Array]',
                '[object Uint8Array]',
                '[object Uint8ClampedArray]',
                '[object Int16Array]',
                '[object Uint16Array]',
                '[object Int32Array]',
                '[object Uint32Array]',
                '[object Float32Array]',
                '[object Float64Array]',
            ].indexOf(Object.prototype.toString.call(obj)) > -1);


            // Blob Constructor
            function Blob(...args) {
                const [ary, options] = args;
                validateArgs.call(this, ary, options, Blob);

                const data = _.map(ary, chunk => {
                    if (chunk instanceof Blob) {
                        return chunk._buffer;
                    } else if (typeof chunk === 'string') {
                        return textEncode(chunk);
                    } else if (win.ArrayBuffer && (chunk instanceof ArrayBuffer || isArrayBufferView(chunk))) {
                        return bufferClone(chunk);
                    } else if (win.DataView && chunk instanceof DataView) {
                        return bufferClone(chunk.buffer);
                    } else {
                        return textEncode(String(chunk));
                    }
                });

                this._buffer = toBuffer(data);
                this.size = this._buffer.length;

                this.type = (options || {}).type || '';
                this.type = /[^\u0020-\u007E]/.test(this.type) ? '' : this.type.toLowerCase();
            }

            Object.assign(Blob.prototype, {
                arrayBuffer() { return Promise.resolve(this._buffer); },
                text() { return Promise.resolve(textDecode(this._buffer)); },
                slice(start, end, type) {
                    return new Blob([this._buffer.slice(start || 0, end || this._buffer.length)], {type});
                },
                toString : () => '[object Blob]',
            });

            return Blob;
        }

        if ((() => {
            // Check if Blob constructor is supported
            try { return new Blob(['ä']).size === 2; } catch (e) {}
        })()) {
            // support Blob
            target.Blob = BlobConstructor;
        } else if (BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob) {
            // support BlobBuilder
            target.Blob = BlobBuilderConstructor;
        } else {
            target.Blob = FakeBlobBuilder();
        }

        const prototype = target.Blob.prototype;
        Object.assign(prototype, {
            [Symbol.toStringTag] : 'Blob',
            stream               : prototype.stream || function () {
                let position = 0;
                const blob = this;

                // noinspection JSUnusedGlobalSymbols
                return new ReadableStream({
                    type                  : 'bytes',
                    autoAllocateChunkSize : 524288,

                    pull : controller => {
                        const v = controller.byobRequest.view;
                        const chunk = blob.slice(position, position + v.byteLength);
                        return chunk.arrayBuffer().then(buffer => {
                            const uint8array = new Uint8Array(buffer);
                            const bytesRead = uint8array.byteLength;

                            position += bytesRead;
                            v.set(uint8array);
                            controller.byobRequest.respond(bytesRead);

                            position >= blob.size && controller.close();
                        });
                    },
                });
            },
        });
    }

    return target;
})(window)));
