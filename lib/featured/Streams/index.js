/**
 * Patches for `ReadableStream`
 * REF:
 *   - https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
 *   - https://developer.mozilla.org/en-US/docs/Web/API/WritableStream
 */

const memorize = require('util/memorize');
module.exports = new Promise(resolve => resolve((async win => {
    const target = process.env['TEST_ENV']
        ? {ReadableStream : win.ReadableStream, WritableStream : win.WritableStream}
        : win;

    const polyfills = memorize(
        async () => await import(/* webpackChunkName: "web-streams" */'web-streams-polyfill/dist/ponyfill')
    );

    if (!win.ReadableStream || !win.ReadableStream.prototype.pipeTo) {
        target.ReadableStream = (await polyfills()).ReadableStream;
    }

    !win.WritableStream && (target.WritableStream = (await polyfills()).WritableStream);

    return target;
})(window)));
