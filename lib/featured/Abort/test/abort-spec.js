// REF: https://github.com/mo/abortcontroller-polyfill/blob/master/tests/basic.test.js
const url = `http://localhost:${require('./server-port')}`;
const baseUrl = s => s == null ? url : `${url}?sleepMillis=${s}`;
const memorize = require('util/memorize');
const polyfill = memorize(async () => await require('../index'));

describe('AbortController & AbortSignal', () => {
    let AbortController, AbortSignal, fetch, Request;
    beforeEach(async () => {
        !AbortController && (AbortController = (await polyfill()).AbortController);
        !AbortSignal && (AbortSignal = (await polyfill()).AbortSignal);
        !fetch && (fetch = (await polyfill()).fetch);
        !Request && (Request = (await polyfill()).Request);
    });

    const doFetch = async (requestOrSleepMillis, signal) => {
        try {
            if (requestOrSleepMillis instanceof Request) {
                await fetch(requestOrSleepMillis);
            } else {
                await fetch(baseUrl(requestOrSleepMillis), {signal});
            }
        } catch (err) {
            expect(err.name).toBe('AbortError');
        }
    };

    it('Request object has .signal', async () => {
        const controller = new AbortController();
        const signal = controller.signal;
        const request = new Request('/', {signal});

        expect(!request.signal).toBe(false); // missing request.signal
        expect(!Object.prototype.isPrototypeOf.call(Request.prototype, request)).toBe(false); // wrong prototype
    });

    it('abort during fetch', async () => {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => { controller.abort(); }, 500);
        await doFetch(1000, signal);
    });

    it('abort when multiple fetches are using the same signal', async () => {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => { controller.abort(); }, 500);
        await doFetch(900, signal);
        await doFetch(1100, signal);
    });

    it('abort during fetch when Request has signal', async () => {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => { controller.abort(); }, 500);
        await doFetch(new Request(baseUrl(1000), {signal}));
    });

    it('abort before fetch started', async () => {
        const controller = new AbortController();
        controller.abort();
        const signal = controller.signal;
        await doFetch(1000, signal);
    });

    it('abort before fetch started, verify no HTTP request is made', async () => {
        const controller = new AbortController();
        controller.abort();
        const signal = controller.signal;
        await doFetch(null, signal);
    });

    it('fetch without aborting', async () => {
        const controller = new AbortController();
        const signal = controller.signal;
        await doFetch(50, signal);
    });

    it('fetch without signal set', async () => {
        await doFetch(50);
    });

    it('event listener fires "abort" event', async () => {
        expect(await new Promise(resolve => {
            setTimeout(() => resolve(false), 2000);
            const controller = new AbortController();
            controller.signal.addEventListener('abort', () => resolve(true));
            controller.abort();
        })).toBe(true);
    });

    it('signal.aborted is true after abort', async () => {
        expect(await new Promise(resolve => {
            setTimeout(() => resolve(false), 2000);
            const controller = new AbortController();
            controller.signal.addEventListener('abort', () => resolve(controller.signal.aborted));
            controller.abort();

            expect(controller.signal.aborted).toBe(true);
        })).toBe(true);
    });

    it('event listener doesn\'t fire "abort" event after removeEventListener', async () => {
        expect(await new Promise(resolve => {
            setTimeout(() => resolve(true), 2000);
            const controller = new AbortController();
            const handler = () => resolve(false);
            controller.signal.addEventListener('abort', handler);
            controller.signal.removeEventListener('abort', handler);
            controller.abort();
        })).toBe(true);
    });

    it('signal.onabort called on abort', async () => {
        expect(await new Promise(resolve => {
            setTimeout(() => resolve(false), 2000);
            const controller = new AbortController();
            controller.signal.onabort = () => resolve(true);
            controller.abort();
        })).toBe(true);
    });

    window.Worker && it('fetch from web worker works', async () => {
        expect(await new Promise(resolve => {
            setTimeout(() => resolve(false), 10000);
            const worker = new Worker('/web-worker.js');
            worker.postMessage(baseUrl(10000));
            worker.onmessage = ({data}) => resolve(data);
        })).toBe(true);
    });

    it('toString() output', () => {
        expect(`${new AbortController()}`).toBe('[object AbortController]');
        expect(Object.prototype.toString.call(new AbortController())).toBe('[object AbortController]');
        expect(`${new AbortController().signal}`).toBe('[object AbortSignal]');
    });

    it('instance of AbortSignal', () => {
        expect(new AbortController().signal instanceof AbortSignal).toBe(true);
    });
});
