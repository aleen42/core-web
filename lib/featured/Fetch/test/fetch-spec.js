// REF: https://github.com/github/fetch/blob/master/test/test.js

const url = `http://localhost:${require('./server-port')}`;
const memorize = require('util/memorize');
const polyfill = memorize(async () => await require('../index'));
const urlPolyfill = memorize(async () => await require('../../../stable/URL'));
const abortPolyfill = memorize(async () => await require('../../Abort'));
const {browser : {name : browserName}} = require('detector'), IEVersion = document.documentMode;

describe('Fetch', () => {
    let fetch, Headers, Request, Response, URL, URLSearchParams, Blob, FileReader, FormData, AbortController;
    beforeEach(async () => {
        !fetch && (fetch = (await abortPolyfill()).fetch);
        !Headers && (Headers = (await polyfill()).Headers);
        !Request && (Request = (await abortPolyfill()).Request);
        !Response && (Response = (await polyfill()).Response);
        !URL && (URL = (await urlPolyfill()).URL);
        !URLSearchParams && (URLSearchParams = (await urlPolyfill()).URLSearchParams);
        !Blob && (Blob = (await require('../../../stable/Blob')).Blob);
        !FileReader && (FileReader = (await require('../../../stable/FileReader')).FileReader);
        !FormData && (FormData = (await require('../../../stable/FormData')).FormData);
        !AbortController && (AbortController = (await abortPolyfill()).AbortController);
    });

    // var IEorEdge = /Edge\//.it(navigator.userAgent) || /MSIE/.it(navigator.userAgent);
    // var Chrome = /Chrome\//.it(navigator.userAgent) && !IEorEdge;
    //
    // var support = {
    //     url: (function(url) {
    //         try {
    //             return new URL(url).toString() === url;
    //         } catch (e) {
    //             return false;
    //         }
    //     })('http://example.com/'),
    //     blob:
    //         'FileReader' in self
    //         && 'Blob' in self
    //         && (function() {
    //             try {
    //                 new Blob();
    //                 return true;
    //             } catch (e) {
    //                 return false;
    //             }
    //         })(),
    //     formData: 'FormData' in self,
    //     arrayBuffer: 'ArrayBuffer' in self,
    //     aborting: 'signal' in new Request(''),
    //     permanentRedirect: !/Trident/.it(navigator.userAgent),
    // };

    const readBlobAsText = blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });

    const readBlobAsBytes = blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve([].slice.call(new Uint8Array(reader.result)));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });

    const arrayBufferFromText = text => new Uint8Array(text.split('').map(ch => ch.charCodeAt(0))).buffer;
    const readArrayBufferAsText = buf => Array.from(new Uint8Array(buf)).map(i => String.fromCharCode(i)).join('');

    // https://fetch.spec.whatwg.org/#concept-bodyinit-extract
    const testBodyExtract = factory => {
        describe('body extract', () => {
            const expected = 'Hello World!';
            const inputs = [
                ['type USVString', () => expected],
                ['type Blob', () => new Blob([expected])],
            ].concat(window.ArrayBuffer ? [
                ['type ArrayBuffer', () => arrayBufferFromText(expected)],
                ['type TypedArray', () => new Uint8Array(arrayBufferFromText(expected))],
                ['type DataView', () => new DataView(arrayBufferFromText(expected))],
            ] : []);

            inputs.forEach(([typeLabel, body]) => {
                describe(typeLabel, () => {
                    it('consume as blob', () => factory(body())
                        .blob()
                        .then(readBlobAsText)
                        .then(text => { expect(text).toBe(expected); }));

                    it('consume as text', () => factory(body()).text().then(text => { expect(text).toBe(expected); }));

                    it('consume as array buffer', () => factory(body())
                        .arrayBuffer()
                        .then(readArrayBufferAsText)
                        .then(text => { expect(text).toBe(expected); }));
                });
            });
        });
    };

    // https://fetch.spec.whatwg.org/#headers-class
    describe('Headers', () => {
        it('constructor copies headers', () => {
            const original = new Headers();
            original.append('Accept', 'application/json');
            original.append('Accept', 'text/plain');
            original.append('Content-Type', 'text/html');

            const headers = new Headers(original);
            expect(headers.get('Accept')).toBe('application/json, text/plain');
            expect(headers.get('Content-type')).toBe('text/html');
        });

        it('constructor works with arrays', () => {
            const headers = new Headers([['Content-Type', 'text/xml'], ['Breaking-Bad', '<3']]);
            expect(headers.get('Content-Type')).toBe('text/xml');
            expect(headers.get('Breaking-Bad')).toBe('<3');
        });

        it('headers are case insensitive', () => {
            const headers = new Headers({Accept : 'application/json'});
            expect(headers.get('ACCEPT')).toBe('application/json');
            expect(headers.get('Accept')).toBe('application/json');
            expect(headers.get('accept')).toBe('application/json');
        });

        it('appends to existing', () => {
            const headers = new Headers({Accept : 'application/json'});
            expect(headers.has('Content-Type')).toBeFalse();
            headers.append('Content-Type', 'application/json');
            expect(headers.has('Content-Type')).toBeTrue();
            expect(headers.get('Content-Type')).toBe('application/json');
        });

        it('appends values to existing header name', () => {
            const headers = new Headers({Accept : 'application/json'});
            headers.append('Accept', 'text/plain');
            expect(headers.get('Accept')).toBe('application/json, text/plain');
        });

        it('sets header name and value', () => {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            expect(headers.get('Content-Type')).toBe('application/json');
        });

        it('returns null on no header found', () => {
            const headers = new Headers();
            expect(headers.get('Content-Type')).toBeNull();
        });

        it('has headers that are set', () => {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            expect(headers.has('Content-Type')).toBeTrue();
        });

        it('deletes headers', () => {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            expect(headers.has('Content-Type')).toBeTrue();
            headers.delete('Content-Type');
            expect(headers.has('Content-Type')).toBeFalse();
            expect(headers.get('Content-Type')).toBeNull();
        });

        it('converts field name to string on set and get', () => {
            const headers = new Headers();
            headers.set(1, 'application/json');
            expect(headers.has('1')).toBeTrue();
            expect(headers.get(1)).toBe('application/json');
        });

        it('converts field value to string on set and get', () => {
            const headers = new Headers();
            headers.set('Content-Type', 1);
            headers.set('X-CSRF-Token', undefined);
            expect(headers.get('Content-Type')).toBe('1');
            expect(headers.get('X-CSRF-Token')).toBe('undefined');
        });

        it('throws TypeError on invalid character in field name', () => {
            expect(() => { new Headers({'[Accept]' : 'application/json'}); }).toThrowError();
            expect(() => { new Headers({'Accept:' : 'application/json'}); }).toThrowError();
            expect(() => {
                const headers = new Headers();
                headers.set({field : 'value'}, 'application/json');
            }).toThrowError();
            expect(() => { new Headers({'' : 'application/json'}); }).toThrowError();
        });

        it('is iterable with forEach', () => {
            const headers = new Headers();
            headers.append('Accept', 'application/json');
            headers.append('Accept', 'text/plain');
            headers.append('Content-Type', 'text/html');

            const results = [];
            headers.forEach((value, key, object) => {
                results.push(({value, key, object}));
            });
            expect(results.length).toBe(2);
            expect({key : 'accept', value : 'application/json, text/plain', object : headers}).toEqual(results[0]);
            expect({key : 'content-type', value : 'text/html', object : headers}).toEqual(results[1]);
        });

        it('forEach accepts second thisArg argument', () => {
            const headers = new Headers({Accept : 'application/json'});
            const thisArg = 42;
            headers.forEach(function () { expect(this).toEqual(thisArg); }, thisArg);
        });

        it('is iterable with keys', () => {
            const headers = new Headers();
            headers.append('Accept', 'application/json');
            headers.append('Accept', 'text/plain');
            headers.append('Content-Type', 'text/html');

            const iterator = headers.keys();
            expect({done : false, value : 'accept'}).toEqual(iterator.next());
            expect({done : false, value : 'content-type'}).toEqual(iterator.next());
            expect({done : true, value : undefined}).toEqual(iterator.next());
        });

        it('is iterable with values', () => {
            const headers = new Headers();
            headers.append('Accept', 'application/json');
            headers.append('Accept', 'text/plain');
            headers.append('Content-Type', 'text/html');

            const iterator = headers.values();
            expect({done : false, value : 'application/json, text/plain'}).toEqual(iterator.next());
            expect({done : false, value : 'text/html'}).toEqual(iterator.next());
            expect({done : true, value : undefined}).toEqual(iterator.next());
        });

        it('is iterable with entries', () => {
            const headers = new Headers();
            headers.append('Accept', 'application/json');
            headers.append('Accept', 'text/plain');
            headers.append('Content-Type', 'text/html');

            const iterator = headers.entries();
            expect({done : false, value : ['accept', 'application/json, text/plain']}).toEqual(iterator.next());
            expect({done : false, value : ['content-type', 'text/html']}).toEqual(iterator.next());
            expect({done : true, value : undefined}).toEqual(iterator.next());
        });
    });

    // https://fetch.spec.whatwg.org/#request-class
    describe('Request', () => {
        it('called as normal function', () => {
            expect(() => { Request('https://fetch.spec.whatwg.org/'); }).toThrowError();
        });

        it('construct with string url', () => {
            expect(new Request('https://fetch.spec.whatwg.org/').url)
                .toBe('https://fetch.spec.whatwg.org/');
        });

        it('construct with URL instance', () => {
            const url = new URL('https://fetch.spec.whatwg.org/');
            url.pathname = 'cors';
            expect(new Request(url).url).toBe('https://fetch.spec.whatwg.org/cors');
        });

        it('construct with non-Request object', () => {
            expect(new Request({
                toString : () => 'https://fetch.spec.whatwg.org/',
            }).url).toBe('https://fetch.spec.whatwg.org/');
        });

        it('construct with Request', async () => {
            const request1 = new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                body    : 'I work out',
                headers : {
                    accept         : 'application/json',
                    'Content-Type' : 'text/plain',
                },
            });
            const request2 = new Request(request1);
            const body2 = await request2.text();
            expect(body2).toBe('I work out');
            expect(request2.method).toBe('POST');
            expect(request2.url).toBe('https://fetch.spec.whatwg.org/');
            expect(request2.headers.get('accept')).toBe('application/json');
            expect(request2.headers.get('content-type')).toBe('text/plain');

            return request1.text().then(
                () => { throw new Error('original request body should have been consumed'); },
                error => {
                    expect(() => { throw error; }).toThrowMatching(thrown => `${thrown}` === ({
                        // eslint-disable-next-line max-len
                        'chrome' : 'TypeError: Failed to execute \'text\' on \'Request\': body stream already read',
                        // eslint-disable-next-line max-len
                        'na'      : 'TypeError: Failed to execute \'text\' on \'Request\': body stream already read', // Chrome Headless
                        'ie'      : 'TypeError: Already read',
                        'firefox' : 'TypeError: Request.text: Body has already been consumed.',
                    })[browserName]);
                }
            );
        });

        it('construct with Request and override headers', () => {
            const request = new Request(new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                body    : 'I work out',
                headers : {
                    accept         : 'application/json',
                    'X-Request-ID' : '123',
                },
            }), {
                headers : {'x-test' : '42'},
            });

            expect(request.headers.get('accept')).toBeNull();
            expect(request.headers.get('x-request-id')).toBeNull();
            expect(request.headers.get('x-test')).toBe('42');
        });

        it('construct with Request and override body', async () => {
            const request = new Request(new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                body    : 'I work out',
                headers : {
                    'Content-Type' : 'text/plain',
                },
            }), {
                body    : '{"wiggles": 5}',
                headers : {'Content-Type' : 'application/json'},
            });

            const data = await request.json();
            // noinspection JSUnresolvedVariable
            expect(data.wiggles).toBe(5);
            expect(request.headers.get('content-type')).toBe('application/json');
        });

        it('construct with used Request body', async () => {
            const request1 = new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
                body   : 'I work out',
            });

            await request1.text();
            expect(() => { new Request(request1); }).toThrowError();
        });

        it('GET should not have implicit Content-Type', () => {
            expect(new Request('https://fetch.spec.whatwg.org/').headers.get('content-type')).toBeNull();
        });

        it('POST with blank body should not have implicit Content-Type', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
            }).headers.get('content-type')).toBeNull();
        });

        it('construct with string body sets Content-Type header', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
                body   : 'I work out',
            }).headers.get('content-type')).toBe('text/plain;charset=UTF-8');
        });

        it('construct with Blob body and type sets Content-Type header', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
                body   : new Blob(['test'], {type : 'image/png'}),
            }).headers.get('content-type')).toBe('image/png');
        });

        it('construct with body and explicit header uses header', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                headers : {'Content-Type' : 'image/png'},
                body    : 'I work out',
            }).headers.get('content-type')).toBe('image/png');
        });

        it('construct with Blob body and explicit Content-Type header', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                headers : {'Content-Type' : 'image/png'},
                body    : new Blob(['test'], {type : 'text/plain'}),
            }).headers.get('content-type')).toBe('image/png');
        });

        it('construct with URLSearchParams body sets Content-Type header', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
                body   : new URLSearchParams('a=1&b=2'),
            }).headers.get('content-type')).toBe('application/x-www-form-urlencoded;charset=UTF-8');
        });

        it('construct with URLSearchParams body and explicit Content-Type header', () => {
            expect(new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                headers : {'Content-Type' : 'image/png'},
                body    : new URLSearchParams('a=1&b=2'),
            }).headers.get('content-type')).toBe('image/png');
        });

        it('construct with unsupported body type', async () => {
            const req = new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
                body   : {},
            });

            expect(req.headers.get('content-type')).toBe('text/plain;charset=UTF-8');
            expect(await req.text()).toBe('[object Object]');
        });

        it('construct with null body', async () => {
            const req = new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
            });

            expect(req.headers.get('content-type')).toBeNull();
            expect(await req.text()).toBe('');
        });

        it('clone GET request', () => {
            const req = new Request('https://fetch.spec.whatwg.org/', {
                headers : {'content-type' : 'text/plain'},
            });
            const clone = req.clone();

            expect(clone.url).toBe(req.url);
            expect(clone.method).toBe('GET');
            expect(clone.headers.get('content-type')).toBe('text/plain');
            expect(clone.headers).not.toBe(req.headers);
            expect(req.bodyUsed).toBeFalse();
        });

        it('clone POST request', async () => {
            const req = new Request('https://fetch.spec.whatwg.org/', {
                method  : 'post',
                headers : {'content-type' : 'text/plain'},
                body    : 'I work out',
            });
            const clone = req.clone();

            expect(clone.method).toBe('POST');
            expect(clone.headers.get('content-type')).toBe('text/plain');
            expect(clone.headers).not.toBe(req.headers);
            expect(req.bodyUsed).toBeFalse();
            expect(await Promise.all([clone.text(), req.clone().text()])).toEqual(['I work out', 'I work out']);
        });

        it('clone with used Request body', async () => {
            const req = new Request('https://fetch.spec.whatwg.org/', {
                method : 'post',
                body   : 'I work out',
            });

            await req.text();
            expect(() => { req.clone(); }).toThrowError();
        });

        testBodyExtract(body => new Request('', {method : 'POST', body : body}));

        it('credentials defaults to same-origin', () => {
            expect(new Request('').credentials).toBe('same-origin');
        });

        it('credentials is overridable', () => {
            expect(new Request('', {credentials : 'omit'}).credentials).toBe('omit');
        });
    });

    // https://fetch.spec.whatwg.org/#response-class
    describe('Response', () => {
        it('default status is 200', () => {
            const res = new Response();
            expect(res.status).toBe(200);
            expect(res.statusText).toBe('');
            expect(res.ok).toBeTrue();
        });

        it('default status is 200 when an explicit undefined status code is passed', () => {
            const res = new Response('', {status : undefined});
            expect(res.status).toBe(200);
            expect(res.statusText).toBe('');
            expect(res.ok).toBeTrue();
        });

        testBodyExtract(body => new Response(body));

        it('called as normal function', () => {
            expect(() => {
                Response('{"foo":"bar"}', {headers : {'content-type' : 'application/json'}});
            }).toThrowError();
        });

        it('creates Headers object from raw headers', async () => {
            const r = new Response('{"foo":"bar"}', {headers : {'content-type' : 'application/json'}});
            expect(r.headers instanceof Headers).toBeTrue();
            expect((await r.json()).foo).toBe('bar');
        });

        it('always creates a new Headers instance', () => {
            const headers = new Headers({'x-hello' : 'world'});
            const res = new Response('', {headers : headers});

            expect(res.headers.get('x-hello')).toBe('world');
            expect(res.headers).not.toBe(headers);
        });

        it('clone text response', async () => {
            const res = new Response('{"foo":"bar"}', {
                headers : {'content-type' : 'application/json'},
            });
            const clone = res.clone();

            expect(clone.headers).not.toBe(res.headers);
            expect(clone.headers.get('content-type')).toBe('application/json');

            const jsons = await Promise.all([clone.json(), res.json()]);
            expect(jsons[0]).toEqual(jsons[1]);
        });

        it('clone blob response', () => {
            const req = new Request(new Blob(['test']));
            req.clone();
            expect(req.bodyUsed).toBeFalse();
        });

        it('error creates error Response', () => {
            const r = Response.error();
            expect(r instanceof Response).toBeTrue();
            expect(r.status).toBe(0);
            expect(r.statusText).toBe('');
            expect(r.type).toBe('error');
        });

        it('redirect creates redirect Response', () => {
            const r = Response.redirect('https://fetch.spec.whatwg.org/', 301);
            expect(r instanceof Response).toBeTrue();
            expect(r.status).toBe(301);
            expect(r.headers.get('Location')).toBe('https://fetch.spec.whatwg.org/');
        });

        it('construct with string body sets Content-Type header', () => {
            expect(new Response('I work out').headers.get('content-type')).toBe('text/plain;charset=UTF-8');
        });

        it('construct with Blob body and type sets Content-Type header', () => {
            expect(new Response(new Blob(['test'], {type : 'text/plain'})).headers.get('content-type'))
                .toBe('text/plain');
        });

        it('construct with body and explicit header uses header', () => {
            expect(new Response('I work out', {
                headers : {'Content-Type' : 'text/plain'},
            }).headers.get('content-type')).toBe('text/plain');
        });

        it('construct with undefined statusText', () => {
            expect(new Response('', {statusText : undefined}).statusText).toBe('');
        });

        it('construct with null statusText', () => {
            expect(new Response('', {statusText : null}).statusText).toBe('null');
        });

        it('init object as first argument', async () => {
            const r = new Response({
                status  : 201,
                headers : {
                    'Content-Type' : 'text/html',
                },
            });

            expect(r.status).toBe(200);
            expect(r.headers.get('content-type')).toBe('text/plain;charset=UTF-8');
            expect(await r.text()).toBe('[object Object]');
        });

        it('null as first argument', async () => {
            const r = new Response(null);

            expect(r.headers.get('content-type')).toBeNull();
            expect(await r.text()).toBe('');
        });
    });

    // https://fetch.spec.whatwg.org/#body-mixin
    describe('Body mixin', () => {
        describe('arrayBuffer', () => {
            it('resolves arrayBuffer promise', () => fetch(`${url}/hello`)
                .then(response => response.arrayBuffer())
                .then(buf => {
                    expect(buf instanceof ArrayBuffer).toBeTrue();
                    expect(buf.byteLength).toBe(2);
                }));

            it('arrayBuffer handles binary data', () => fetch(`${url}/binary`)
                .then(response => response.arrayBuffer())
                .then(buf => {
                    expect(buf instanceof ArrayBuffer).toBeTrue();
                    expect(buf.byteLength).toBe(128);
                    // noinspection JSCheckFunctionSignatures
                    const view = new Uint8Array(buf);
                    _.times(128, i => {
                        expect(view[i]).toBe(i);
                    });
                }));

            it('arrayBuffer handles utf-8 data', () => fetch(`${url}/hello/utf8`)
                .then(response => response.arrayBuffer())
                .then(buf => {
                    expect(buf instanceof ArrayBuffer).toBeTrue();
                    expect(buf.byteLength).toBe(5);
                    // noinspection JSCheckFunctionSignatures
                    expect([].slice.call(new Uint8Array(buf))).toEqual([104, 101, 108, 108, 111]);
                }));

            it('arrayBuffer handles utf-16le data', () => fetch(`${url}/hello/utf16le`)
                .then(response => response.arrayBuffer())
                .then(buf => {
                    expect(buf instanceof ArrayBuffer).toBeTrue();
                    // eslint-disable-next-line max-len
                    // NOTE: `XMLRequestHttp` returns a text rather than a `Blob` under IE9-, and it means that `fetch()` cannot handle `utf-16le` data.
                    if (browserName === 'ie' && IEVersion <= 9) {
                        expect(buf.byteLength).toBe(5);
                        // noinspection JSCheckFunctionSignatures
                        expect([].slice.call(new Uint8Array(buf))).toEqual([104, 101, 108, 108, 111]);
                    } else {
                        expect(buf.byteLength).toBe(10);
                        // noinspection JSCheckFunctionSignatures
                        expect([].slice.call(new Uint8Array(buf))).toEqual([104, 0, 101, 0, 108, 0, 108, 0, 111, 0]);
                    }

                }));

            it('rejects arrayBuffer promise after body is consumed', () => fetch(`${url}/hello`)
                .then(response => {
                    expect(response.bodyUsed).toBeFalse();
                    response.blob();
                    expect(response.bodyUsed).toBeTrue();
                    return response.arrayBuffer();
                })
                .catch(error => {
                    expect(error instanceof TypeError).toBeTrue();
                }));
        });

        describe('blob', () => {
            it('resolves blob promise', () => fetch(`${url}/hello`)
                .then(response => response.blob())
                .then(blob => {
                    expect(blob instanceof Blob).toBeTrue();
                    expect(blob.size).toBe(2);
                }));

            it('blob handles binary data', () => fetch(`${url}/binary`)
                .then(response => response.blob())
                .then(blob => {
                    expect(blob instanceof Blob).toBeTrue();
                    expect(blob.size).toBe(128);
                }));

            it('blob handles utf-8 data', () => fetch(`${url}/hello/utf8`)
                .then(response => response.blob())
                .then(readBlobAsBytes)
                .then(octets => {
                    expect(octets.length).toBe(5);
                    expect(octets).toEqual([104, 101, 108, 108, 111]);
                }));

            it('blob handles utf-16le data', () => fetch(`${url}/hello/utf16le`)
                .then(response => response.blob())
                .then(readBlobAsBytes)
                .then(octets => {
                    // eslint-disable-next-line max-len
                    // NOTE: `XMLHttpRequest` returns a text rather than a `Blob` under IE9-, and it means that `fetch()` cannot handle `utf-16le` data.
                    if (browserName === 'ie' && IEVersion <= 9) {
                        expect(octets.length).toBe(5);
                        expect(octets).toEqual([104, 101, 108, 108, 111]);
                    } else {
                        expect(octets.length).toBe(10);
                        expect(octets).toEqual([104, 0, 101, 0, 108, 0, 108, 0, 111, 0]);
                    }
                }));

            it('rejects blob promise after body is consumed', () => fetch(`${url}/hello`)
                .then(response => {
                    expect(response.blob).not.toBeNull();
                    expect(response.bodyUsed).toBeFalse();
                    response.text();
                    expect(response.bodyUsed).toBeTrue();
                    return response.blob();
                })
                .catch(error => {
                    expect(error instanceof TypeError).toBeTrue();
                }));
        });

        describe('formData', () => {
            it('post sets content-type header', () => fetch(`${url}/request`, {
                method : 'post',
                body   : new FormData(),
            })
                .then(response => response.json())
                .then(json => {
                    expect(json.method).toBe('POST');
                    expect(/^multipart\/form-data;/.test(json.headers['content-type'])).toBeTrue();
                }));

            it('formData rejects after body was consumed', () => fetch(`${url}/json`)
                .then(response => {
                    expect(!!response.formData).toBeTrue();
                    return response.formData();
                })
                .catch(error => { expect(error instanceof TypeError).toBeTrue(); }));

            it('parses form encoded response', () => fetch(`${url}/form`)
                .then(response => response.formData())
                .then(form => { expect(form instanceof FormData).toBeTrue(); }));
        });

        describe('jsons', () => {
            it('parses json response', () => fetch(`${url}/json`)
                .then(response => response.json())
                .then(json => {
                    expect(json.name).toBe('Hubot');
                    expect(json.login).toBe('hubot');
                }));

            it('rejects json promise after body is consumed', () => fetch(`${url}/json`)
                .then(response => {
                    expect(!!response.json).toBeTrue();
                    expect(response.bodyUsed).toBeFalse();
                    response.text();
                    expect(response.bodyUsed).toBeTrue();
                    return response.json();
                })
                .catch(error => { expect(error instanceof TypeError).toBeTrue(); }));

            it('handles json parse error', () => fetch(`${url}/json-error`)
                .then(response => response.json())
                .catch(error => {
                    expect(() => { throw error; }).toThrowMatching(thrown => /^SyntaxError:/.test(`${thrown}`));
                }));
        });

        describe('text', () => {
            it('handles 204 No Content response', () => fetch(`${url}/empty`)
                .then(response => {
                    expect(response.status).toBe(204);
                    return response.text();
                })
                .then(body => { expect(body).toBe(''); }));

            it('resolves text promise', () => fetch(`${url}/hello`)
                .then(response => response.text())
                .then(text => { expect(text).toBe('hi'); }));

            it('rejects text promise after body is consumed', () => fetch(`${url}/hello`)
                .then(response => {
                    expect(!!response.text).toBeTrue();
                    expect(response.bodyUsed).toBeFalse();
                    response.text();
                    expect(response.bodyUsed).toBeTrue();
                    return response.text();
                })
                .catch(error => { expect(error instanceof TypeError).toBeTrue(); }));
        });
    });

    describe('fetch method', () => {
        describe('promise resolution', () => {
            it('resolves promise on 500 error', () => fetch(`${url}/boom`)
                .then(response => {
                    expect(response.status).toBe(500);
                    expect(response.ok).toBeFalse();
                    return response.text();
                })
                .then(body => { expect(body).toBe('boom'); }));

            it('rejects promise for network error', () => fetch(`${url}/error`)
                .then(response => { throw new Error(`HTTP status ${response.status} was treated as success`); })
                .catch(error => { expect(error instanceof TypeError).toBeTrue(); }));

            it('rejects when Request constructor throws', () => fetch(`${url}/request`, {
                method : 'GET', body : 'invalid',
            })
                .then(() => { throw new Error('Invalid Request init was accepted'); })
                .catch(error => { expect(error instanceof TypeError).toBeTrue(); }));
        });

        describe('request', () => {
            it('sends headers', () => fetch(`${url}/request`, {
                headers : {
                    Accept   : 'application/json',
                    'X-Test' : '42',
                },
            })
                .then(response => response.json())
                .then(json => {
                    expect(json.headers['accept']).toBe('application/json');
                    expect(json.headers['x-test']).toBe('42');
                }));

            it('with Request as argument', () => fetch(new Request(`${url}/request`, {
                headers : {
                    Accept   : 'application/json',
                    'X-Test' : '42',
                },
            }))
                .then(response => response.json())
                .then(json => {
                    expect(json.headers['accept']).toBe('application/json');
                    expect(json.headers['x-test']).toBe('42');
                }));

            it('reusing same Request multiple times', () => {
                const request = new Request(`${url}/request`, {
                    headers : {
                        Accept   : 'application/json',
                        'X-Test' : '42',
                    },
                });

                const responses = [];

                return fetch(request)
                    .then(response => {
                        responses.push(response);
                        return fetch(request);
                    })
                    .then(response => {
                        responses.push(response);
                        return fetch(request);
                    })
                    .then(response => {
                        responses.push(response);
                        return Promise.all(responses.map(r => r.json()));
                    })
                    .then(jsons => {
                        jsons.forEach(json => {
                            expect(json.headers['accept']).toBe('application/json');
                            expect(json.headers['x-test']).toBe('42');
                        });
                    });
            });

            describe('ArrayBuffer', () => {
                it('ArrayBuffer body', () => fetch(`${url}/request`, {
                    method : 'post',
                    body   : arrayBufferFromText('name=Hubot'),
                })
                    .then(response => response.json())
                    .then(request => {
                        expect(request.method).toBe('POST');
                        expect(request.data).toBe('name=Hubot');
                    }));

                it('DataView body', () => fetch(`${url}/request`, {
                    method : 'post',
                    body   : new DataView(arrayBufferFromText('name=Hubot')),
                })
                    .then(response => response.json())
                    .then(request => {
                        expect(request.method).toBe('POST');
                        expect(request.data).toBe('name=Hubot');
                    }));

                it('TypedArray body', () => fetch(`${url}/request`, {
                    method : 'post',
                    body   : new Uint8Array(arrayBufferFromText('name=Hubot')),
                })
                    .then(response => response.json())
                    .then(request => {
                        expect(request.method).toBe('POST');
                        expect(request.data).toBe('name=Hubot');
                    }));
            });

            it('sends URLSearchParams body', () => fetch(`${url}/request`, {
                method : 'post',
                body   : new URLSearchParams('a=1&b=2'),
            })
                .then(response => response.json())
                .then(request => {
                    expect(request.method).toBe('POST');
                    expect(request.data).toBe('a=1&b=2');
                }));
        });

        describe('aborting', () => {
            it('Request init creates an AbortSignal without option', () => {
                const request = new Request('/request');
                expect(!!request.signal).toBeTrue();
                expect(request.signal.aborted).toBeFalse();
            });

            it('Request init passes AbortSignal from option', () => {
                const controller = new AbortController();
                const request = new Request('/request', {signal : controller.signal});
                expect(!!request.signal).toBeTrue();
                expect(controller.signal).toEqual(request.signal);
            });

            it('initially aborted signal', () => {
                const controller = new AbortController();
                controller.abort();

                return fetch(`${url}/request`, {signal : controller.signal}).then(
                    () => { throw new Error('Expected to be rejected'); },
                    error => { expect(error.name).toBe('AbortError'); }
                );
            });

            it('initially aborted signal within Request', () => {
                const controller = new AbortController();
                controller.abort();

                return fetch(new Request(`${url}/request`, {signal : controller.signal})).then(
                    () => { throw new Error('Expected to be rejected'); },
                    error => { expect(error.name).toBe('AbortError'); }
                );
            });

            it('mid-request', () => {
                const controller = new AbortController();

                setTimeout(() => { controller.abort(); }, 30);

                return fetch(`${url}/slow?_=${new Date().getTime()}`, {signal : controller.signal}).then(
                    () => { throw new Error('Expected to be rejected'); },
                    error => { expect(error.name).toBe('AbortError'); }
                );
            });

            it('mid-request within Request', () => {
                const controller = new AbortController();
                const request = new Request(`${url}/slow?_=${new Date().getTime()}`, {signal : controller.signal});

                setTimeout(() => { controller.abort(); }, 30);

                return fetch(request).then(
                    () => { throw new Error('Expected to be rejected'); },
                    error => { expect(error.name).toBe('AbortError'); }
                );
            });

            it('abort multiple with same signal', () => {
                const controller = new AbortController();

                setTimeout(() => { controller.abort(); }, 30);

                return Promise.all([
                    fetch(`${url}/slow?_=${new Date().getTime()}`, {signal : controller.signal}).then(
                        () => { throw new Error('Expected to be rejected'); },
                        error => { expect(error.name).toBe('AbortError'); }
                    ),
                    fetch(`${url}/slow?_=${new Date().getTime()}`, {signal : controller.signal}).then(
                        () => { throw new Error('Expected to be rejected'); },
                        error => { expect(error.name).toBe('AbortError'); }
                    ),
                ]);
            });
        });

        describe('response', () => {
            it('populates body', () => fetch(`${url}/hello`)
                .then(response => {
                    expect(response.status).toBe(200);
                    expect(response.ok).toBeTrue();
                    return response.text();
                })
                .then(body => { expect(body).toBe('hi'); }));

            it('parses headers', () => fetch(`${url}/headers?${new Date().getTime()}`).then(response => {
                expect(response.headers.get('Date')).toBe('Mon, 13 Oct 2014 21:02:27 GMT');
                expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
            }));
        });

        // https://fetch.spec.whatwg.org/#methods
        describe('HTTP methods', () => {
            it('supports HTTP GET', () => fetch(`${url}/request`, {method : 'get'})
                .then(response => response.json())
                .then(request => {
                    expect(request.method).toBe('GET');
                    expect(request.data).toBe('');
                }));

            it('GET with body throws TypeError', () => {
                expect(() => {
                    new Request('', {
                        method : 'get',
                        body   : 'invalid',
                    });
                }).toThrowError();
            });

            it('HEAD with body throws TypeError', () => {
                expect(() => {
                    new Request('', {
                        method : 'head',
                        body   : 'invalid',
                    });
                }).toThrowError();
            });

            // eslint-disable-next-line max-len
            // NOTE: native `fetch()` [won't normalize](https://github.com/github/fetch/pull/1119) the `patch` method as uppercase.
            ['post', 'put', 'PATCH', 'delete'].forEach(method => {
                it(`supports HTTP ${method.toUpperCase()}`, () => fetch(`${url}/request`, {
                    method,
                    ...method !== 'delete' && {body : 'name=Hubot'},
                })
                    .then(response => response.json())
                    .then(request => {
                        expect(request.method).toBe(method.toUpperCase());
                        expect(request.data).toBe(method !== 'delete' ? 'name=Hubot' : '');
                    }));
            });
        });

        // https://fetch.spec.whatwg.org/#atomic-http-redirect-handling
        describe('Atomic HTTP redirect handling', () => {
            it('handles 301 redirect response', () => fetch(`${url}/redirect?code=301`)
                .then(response => {
                    expect(response.status).toBe(200);
                    expect(response.ok).toBeTrue();
                    expect(/\/hello/.test(response.url)).toBeTrue();
                    return response.text();
                })
                .then(body => { expect(body).toBe('hi'); }));

            it('handles 302 redirect response', () => fetch(`${url}/redirect?code=302`)
                .then(response => {
                    expect(response.status).toBe(200);
                    expect(response.ok).toBeTrue();
                    expect(/\/hello/.test(response.url)).toBeTrue();
                    return response.text();
                })
                .then(body => { expect(body).toBe('hi'); }));

            it('handles 303 redirect response', () => fetch(`${url}/redirect?code=303`)
                .then(response => {
                    expect(response.status).toBe(200);
                    expect(response.ok).toBeTrue();
                    expect(/\/hello/.test(response.url)).toBeTrue();
                    return response.text();
                })
                .then(body => { expect(body).toBe('hi'); }));

            it('handles 307 redirect response', () => fetch(`${url}/redirect?code=307`)
                .then(response => {
                    expect(response.status).toBe(200);
                    expect(response.ok).toBeTrue();
                    expect(/\/hello/.test(response.url)).toBeTrue();
                    return response.text();
                })
                .then(body => { expect(body).toBe('hi'); }));

            it('handles 308 redirect response', () => fetch(`${url}/redirect?code=308`)
                .then(function (response) {
                    expect(response.status).toBe(200);
                    expect(response.ok).toBeTrue();
                    expect(/\/hello/.test(response.url)).toBeTrue();
                    return response.text();
                })
                .then(body => { expect(body).toBe('hi'); }));
        });

        // https://fetch.spec.whatwg.org/#concept-request-credentials-mode
        // eslint-disable-next-line max-len
        // NOTE: [`credentials`](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials) is not supported under IE9-.
        // REF: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
        'withCredentials' in new XMLHttpRequest() && describe('credentials mode', async () => {
            const cookieUrl = v => v
                ? `${url}/cookie?name=foo&value=${v}&t=${+new Date()}`
                : `${url}/cookie?name=foo&t=${+new Date()}`;

            beforeEach(() =>
                fetch(cookieUrl('reset'), {credentials : 'same-origin'}));

            describe('omit', () => {
                it('does not accept cookies with omit credentials', () =>
                    fetch(cookieUrl('bar'), {credentials : 'omit'})
                        .then(() => fetch(cookieUrl(), {credentials : 'include'}))
                        .then(response => response.text())
                        .then(data => { expect(data).toBe(''); }));

                it('does not send cookies with omit credentials', () =>
                    fetch(cookieUrl('bar'))
                        .then(() => fetch(cookieUrl(), {credentials : 'omit'}))
                        .then(response => response.text())
                        .then(data => { expect(data).toBe(''); }));
            });

            describe('same-origin', () => {
                it('send cookies with same-origin credentials', () =>
                    fetch(cookieUrl('bar'), {credentials : 'same-origin'})
                        .then(() => fetch(cookieUrl(), {credentials : 'same-origin'}))
                        .then(response => response.text())
                        .then(data => { expect(data).toBe(''); }));
            });

            describe('include', () => {
                it('send cookies with include credentials', () =>
                    fetch(cookieUrl('bar'), {credentials : 'include'})
                        .then(() => fetch(cookieUrl(), {credentials : 'include'}))
                        .then(response => response.text())
                        .then(data => { expect(data).toBe('bar'); }));
            });
        });
    });
});
