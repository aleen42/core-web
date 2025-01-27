const toIndex = require('core-js/internals/to-index');
const toOffset = require('core-js/internals/to-offset');
const toLength = require('core-js/internals/to-length');
/**
 * Shims for limited `Uint8Array` to implement `fetch`, `TextEncoder` or `TextDecoder`
 */
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV'] ? {Uint8Array : win.Uint8Array} : win;
    const {ArrayBuffer} = await require('../ArrayBuffer');
    const {DataView} = await require('../DataView');
    const BYTES = 'Uint8'.match(/\d+/)[0] / 8;

    // need to polyfill
    target.Uint8Array = target.Uint8Array || Uint8Array;

    _.assign(Uint8Array.prototype, {
        // TODO: support limited prototype?
        set(array, offset = 0) {
            if (offset + array.length > this.length) throw new RangeError('offset is out of bonds');
            if (array instanceof target.Uint8Array) {
                let i = 0;
                while (i < array.length) {
                    const v = array.view.getInt8(i), index = (i + offset) * BYTES;
                    this[index] = v;
                    this.view.setInt8(index, v);
                    i++;
                }
            } else {
                _.map(array, (v, i) => {
                    const index = (i + offset) * BYTES;
                    this[index] = v;
                    this.view.setInt8(index, v);
                });
            }
        },
        toString : () => '[object Uint8Array]',
    });

    return target;

    function Uint8Array(data, offset, $length) {
        const that = this;
        const WRONG_LENGTH = 'Wrong length';

        let byteOffset = 0;
        let buffer, view, byteLength, length;
        if (data instanceof ArrayBuffer) {
            buffer = data;
            byteOffset = toOffset(offset, BYTES);
            var $len = data.byteLength;
            if ($length === undefined) {
                if ($len % BYTES) throw new RangeError(WRONG_LENGTH);
                byteLength = $len - byteOffset;
                if (byteLength < 0) throw new RangeError(WRONG_LENGTH);
            } else {
                byteLength = toLength($length) * BYTES;
                if (byteLength + byteOffset > $len) throw new RangeError(WRONG_LENGTH);
            }
            length = byteLength / BYTES;
            view = new DataView(buffer);
        } else if (!_.isOBJ(data)) {
            length = _.isArray(data) ? data.length : toIndex(data);
            byteLength = length * BYTES;
            buffer = new ArrayBuffer(byteLength);
            view = new DataView(buffer);
        } // not support typed arrays & array-like objects

        _.assign(that, {
            buffer,
            byteOffset,
            byteLength,
            length,
            view,
        });

        // cannot sync DataView with `setInt8` and `getInt8` due to no descriptors under IE8-
        let i = 0;
        while (i < length) {
            const index = i * BYTES, v = data[i] || view.getInt8(index);

            if (v != null) {
                that[index] = v;
                view.setInt8(index, v);
            }

            i++;
        }

        return that;
    }
})(window)));
