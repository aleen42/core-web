/**
 * Patches for `ReadableStream`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
 *   - https://developer.mozilla.org/en-US/docs/Web/API/WritableStream
 */
const IE8_DOM_DEFINE = require('core-js/internals/ie8-dom-define');
const memorize = require('util/memorize');
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV']
        ? {ReadableStream : win.ReadableStream, WritableStream : win.WritableStream}
        : win;

    const polyfills = memorize(
        async () => await import(/* webpackChunkName: "web-streams" */'web-streams-polyfill/dist/ponyfill')
    );

    if (IE8_DOM_DEFINE) {
        // eslint-disable-next-line max-len
        // NOTE: Not supported under IE8- due to [the reason](https://github.com/MattiasBuelens/web-streams-polyfill/issues/125)
        const thrown = () => { throw new Error('Not supported under IE8-'); };
        return _.assign(target, {ReadableStream : thrown, WritableStream : thrown});
    } else {
        if (!win.ReadableStream || !win.ReadableStream.prototype.pipeTo) {
            target.ReadableStream = (await polyfills()).ReadableStream;
        }

        !win.WritableStream && (target.WritableStream = (await polyfills()).WritableStream);
    }

    return target;
})(window)));
