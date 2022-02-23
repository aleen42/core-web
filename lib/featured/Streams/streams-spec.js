/**
 * REF:
 *  - https://github.com/MattiasBuelens/web-streams-polyfill/blob/master/test/unit/readable-stream/basic.spec.js
 */

const memorize = require('util/memorize');
const polyfill = memorize(async () => await require('./index'));

describe('Streams', () => {
    let ReadableStream, WritableStream, AbortController;

    beforeEach(async () => {
        !ReadableStream && (ReadableStream = (await polyfill()).ReadableStream);
        !WritableStream && (WritableStream = (await polyfill()).WritableStream);
        !AbortController && (AbortController = (await require('../Abort/index')).AbortController);
    });

    describe('ReadableStream', () => {
        describe('constructor', () => {
            it('constructs with no arguments', () => {
                const rs = new ReadableStream();
                expect(rs instanceof ReadableStream).toBe(true);
            });
        });

        describe('getReader', () => {
            it('reads chunks from underlying source', async () => {
                const rs = new ReadableStream({
                    start(c) {
                        c.enqueue('a');
                        c.enqueue('b');
                        c.close();
                    },
                });
                const reader = rs.getReader();
                expect(await reader.read()).toEqual({done : false, value : 'a'});
                expect(await reader.read()).toEqual({done : false, value : 'b'});
                expect(await reader.read()).toEqual({done : true, value : undefined});
            });
        });

        describe('pipeTo', () => {
            it('accepts an abort signal', async () => {
                const rs = new ReadableStream({
                    start(c) {
                        c.enqueue('a');
                        c.close();
                    },
                });
                const ws = new WritableStream();
                const signal = new FakeAbortSignal(false);
                await rs.pipeTo(ws, {signal});
            });

            it('rejects with an AbortError when aborted', async () => {
                const rs = new ReadableStream({
                    start(c) {
                        c.enqueue('a');
                        c.close();
                    },
                });
                const ws = new WritableStream();
                const signal = new FakeAbortSignal(true);
                try {
                    await rs.pipeTo(ws, {signal});
                    fail('should have rejected');
                } catch (e) {
                    expect(e.name).toBe('AbortError');
                }
            });

            function FakeAbortSignal(aborted) {
                if (AbortController) {
                    const controller = new AbortController();
                    const signal = controller.signal;
                    aborted && controller.abort();
                    return signal;
                }

                this.aborted = !!aborted;
                this.addEventListener = () => {};
                this.removeEventListener = () => {};
            }
        });
    });
});
