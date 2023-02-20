// REF: https://github.com/Financial-Times/polyfill-library/blob/master/polyfills/URL/tests.js

const {browser : {name : browserName}, os} = require('detector'), IEVersion = document.documentMode;
const osName = os.name;
const memorize = require('util/memorize');
const polyfill = memorize(async () => await require('./index'));

describe('URL', () => {
    let FormData, File, URL, URLSearchParams;

    beforeEach(async () => {
        !FormData && (FormData = (await require('../FormData')).FormData);
        !File && (File = (await require('../File')).File);
        !URL && (URL = (await polyfill()).URL);
        !URLSearchParams && (URLSearchParams = (await polyfill()).URLSearchParams);
    });

    it('Need to polyfill / patch', () => {
        expect(window.URL !== URL).toBe(
            // patch
            (browserName === 'chrome' || browserName === 'na') && /^(macosx|linux)$/.test(osName)
        );

        // all launchable browsers to test are no required to polyfill URL and URLSearchParams
        expect(window.URLSearchParams !== URLSearchParams).toBe(false);
    });

    it('URL IDL', () => {
        const url = new URL('https://example.com:8080/foo/bar?a=1&b=2#p1');
        expect(typeof url.protocol).toBe('string');
        expect(typeof url.host).toBe('string');
        expect(typeof url.hostname).toBe('string');
        expect(typeof url.port).toBe('string');
        expect(typeof url.pathname).toBe('string');
        expect(typeof url.search).toBe('string');
        expect(typeof url.hash).toBe('string');
        expect(typeof url.origin).toBe('string');
        expect(typeof url.href).toBe('string');
    });

    it('URL Stringify', () => {
        expect(`${new URL('https://example.com')}`).toBe('https://example.com/');
        expect(`${new URL('https://example.com:8080')}`).toBe('https://example.com:8080/');
    });

    it('URL Parsing', () => {
        const url = new URL('https://example.com:8080/foo/bar?a=1&b=2#p1');
        expect(url.protocol).toBe('https:');
        expect(url.hostname).toBe('example.com');
        expect(url.port).toBe('8080');
        expect(url.host).toBe('example.com:8080');
        expect(url.pathname).toBe('/foo/bar');
        expect(url.search).toBe('?a=1&b=2');
        expect(url.hash).toBe('#p1');
        expect(url.origin).toBe('https://example.com:8080');
        expect(url.href).toBe('https://example.com:8080/foo/bar?a=1&b=2#p1');
    });

    it('URL Mutation', () => {
        let url = new URL('https://example.com');
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');
        expect(url.host).toBe('example.com');

        url.protocol = 'ftp';
        expect(url.protocol).toBe('ftp:');
        expect(url.href).toBe('ftp://example.com/');

        // Fails in native IE13 (Edge)
        // Probable bug in IE.  https://twitter.com/patrickkettner/status/768726160070934529
        // expect(url.origin).toBe('ftp://example.com');

        expect(url.host).toBe('example.com');
        url.protocol = 'https';
        expect(url.protocol).toBe('https:');
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');
        expect(url.host).toBe('example.com');

        url = new URL('https://example.com');
        url.hostname = 'example.org';
        expect(url.href).toBe('https://example.org/');
        expect(url.origin).toBe('https://example.org');
        expect(url.host).toBe('example.org');
        url.hostname = 'example.com';
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');
        expect(url.host).toBe('example.com');

        url = new URL('https://example.com');
        url.port = '8080';
        expect(url.href).toBe('https://example.com:8080/');
        expect(url.origin).toBe('https://example.com:8080');
        expect(url.host).toBe('example.com:8080');
        url.port = '443';
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');
        expect(url.host).toBe('example.com');

        url = new URL('https://example.com');
        url.pathname = 'foo';
        expect(url.href).toBe('https://example.com/foo');
        expect(url.origin).toBe('https://example.com');
        url.pathname = 'foo/bar';
        expect(url.href).toBe('https://example.com/foo/bar');
        expect(url.origin).toBe('https://example.com');
        url.pathname = '';
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');

        url = new URL('https://example.com');
        url.search = 'a=1&b=2';
        expect(url.href).toBe('https://example.com/?a=1&b=2');
        expect(url.origin).toBe('https://example.com');
        url.search = '';
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');

        url = new URL('https://example.com');
        url.hash = 'p1';
        expect(url.href).toBe('https://example.com/#p1');
        expect(url.origin).toBe('https://example.com');
        url.hash = '';
        expect(url.href).toBe('https://example.com/');
        expect(url.origin).toBe('https://example.com');
    });

    it('Parameter Mutation', () => {
        const url = new URL('https://example.com');
        expect(url.href).toBe('https://example.com/');
        expect(url.search).toBe('');
        expect(url.searchParams.get('a')).toBeNull();
        expect(url.searchParams.get('b')).toBeNull();

        url.searchParams.append('a', '1');
        expect(url.searchParams.get('a')).toBe('1');
        expect(url.searchParams.getAll('a')).toEqual(['1']);
        expect(url.search).toBe('?a=1');
        expect(url.href).toBe('https://example.com/?a=1');

        url.searchParams.append('b', '2');
        expect(url.searchParams.get('b')).toBe('2');
        expect(url.searchParams.getAll('b')).toEqual(['2']);
        expect(url.search).toBe('?a=1&b=2');
        expect(url.href).toBe('https://example.com/?a=1&b=2');

        url.searchParams.append('a', '3');
        expect(url.searchParams.get('a')).toBe('1');
        expect(url.searchParams.getAll('a')).toEqual(['1', '3']);
        expect(url.search).toBe('?a=1&b=2&a=3');
        expect(url.href).toBe('https://example.com/?a=1&b=2&a=3');

        url.searchParams['delete']('a');
        expect(url.search).toBe('?b=2');
        expect(url.searchParams.getAll('a')).toEqual([]);
        expect(url.href).toBe('https://example.com/?b=2');

        url.searchParams['delete']('b');
        expect(url.searchParams.getAll('b')).toEqual([]);
        expect(url.href).toBe('https://example.com/');

        url.href = 'https://example.com?m=9&n=3';
        expect(url.searchParams.has('a')).toBe(false);
        expect(url.searchParams.has('b')).toBe(false);
        expect(url.searchParams.get('m')).toBe('9');
        expect(url.searchParams.get('n')).toBe('3');

        url.href = 'https://example.com';
        url.searchParams.set('a', '1');
        expect(url.searchParams.getAll('a')).toEqual(['1']);
        url.search = 'a=1&b=1&b=2&c=1';
        url.searchParams.set('b', '3');
        expect(url.searchParams.getAll('b')).toEqual(['3']);
        expect(url.href).toBe('https://example.com/?a=1&b=3&c=1');
    });

    it('Parameter Encoding', () => {
        const url = new URL('https://example.com');
        expect(url.href).toBe('https://example.com/');
        expect(url.search).toBe('');
        url.searchParams.append('this\x00&that\x7f\xff', '1+2=3');
        expect(url.searchParams.get('this\x00&that\x7f\xff')).toBe('1+2=3');

        // The following fail in FF (tested in 38) against native impl
        // expect(url.search).toBe('?this%00%26that%7F%C3%BF=1%2B2%3D3');
        // expect(url.href).toBe('https://example.com/?this%00%26that%7F%C3%BF=1%2B2%3D3');

        url.search = '';
        url.searchParams.append('a  b', 'a  b');
        expect(url.search).toBe('?a++b=a++b');
        expect(url.searchParams.get('a  b')).toBe('a  b');
    });


    it('Base URL', () => {
        // fully qualified URL
        expect(new URL('https://example.com').href).toBe('https://example.com/');
        expect(new URL('https://example.com/foo/bar', 'https://example.org').href).toBe('https://example.com/foo/bar');

        // protocol relative
        expect(new URL('//example.com', 'https://example.org').href).toBe('https://example.com/');

        // path relative
        expect(new URL('/foo/bar', 'https://example.org').href).toBe('https://example.org/foo/bar');
        expect(new URL('/foo/bar', 'https://example.org/baz/bat').href).toBe('https://example.org/foo/bar');
        expect(new URL('./bar', 'https://example.org').href).toBe('https://example.org/bar');
        expect(new URL('./bar', 'https://example.org/foo/').href).toBe('https://example.org/foo/bar');
        expect(new URL('bar', 'https://example.org/foo/').href).toBe('https://example.org/foo/bar');
        expect(new URL('../bar', 'https://example.org/foo/').href).toBe('https://example.org/bar');
        expect(new URL('../bar', 'https://example.org/foo/').href).toBe('https://example.org/bar');
        expect(new URL('../../bar', 'https://example.org/foo/baz/bat/').href).toBe('https://example.org/foo/bar');
        expect(new URL('../../bar', 'https://example.org/foo/baz/bat').href).toBe('https://example.org/bar');
        expect(new URL('../../bar', 'https://example.org/foo/baz/').href).toBe('https://example.org/bar');
        expect(new URL('../../bar', 'https://example.org/foo/').href).toBe('https://example.org/bar');
        expect(new URL('../../bar', 'https://example.org/foo/').href).toBe('https://example.org/bar');

        // search/hash relative
        expect(new URL('bar?ab#cd', 'https://example.org/foo/').href).toBe('https://example.org/foo/bar?ab#cd');
        expect(new URL('bar?ab#cd', 'https://example.org/foo').href).toBe('https://example.org/bar?ab#cd');
        expect(new URL('?ab#cd', 'https://example.org/foo').href).toBe('https://example.org/foo?ab#cd');
        expect(new URL('?ab', 'https://example.org/foo').href).toBe('https://example.org/foo?ab');
        expect(new URL('#cd', 'https://example.org/foo').href).toBe('https://example.org/foo#cd');
    });

    it('URLSearchParams', () => {
        const url = new URL('https://example.com?a=1&b=2');
        expect(url.searchParams instanceof URLSearchParams).toBe(true);

        expect(`${new URLSearchParams()}`).toBe('');
        expect(`${new URLSearchParams('')}`).toBe('');
        expect(`${new URLSearchParams('a=1')}`).toBe('a=1');
        expect(`${new URLSearchParams('a=1&b=1')}`).toBe('a=1&b=1');
        expect(`${new URLSearchParams('a=1&b&a')}`).toBe('a=1&b=&a=');

        expect(`${new URLSearchParams('?')}`).toBe('');
        expect(`${new URLSearchParams('?a=1')}`).toBe('a=1');
        expect(`${new URLSearchParams('?a=1&b=1')}`).toBe('a=1&b=1');
        expect(`${new URLSearchParams('?a=1&b&a')}`).toBe('a=1&b=&a=');

        expect(`${new URLSearchParams(new URLSearchParams('?'))}`).toBe('');
        expect(`${new URLSearchParams(new URLSearchParams('?a=1'))}`).toBe('a=1');
        expect(`${new URLSearchParams(new URLSearchParams('?a=1&b=1'))}`).toBe('a=1&b=1');
        expect(`${new URLSearchParams(new URLSearchParams('?a=1&b&a'))}`).toBe('a=1&b=&a=');
    });

    it('URLSearchParams mutation', () => {
        let p = new URLSearchParams();
        expect(p.get('a')).toBeNull();
        expect(p.get('b')).toBeNull();

        p.append('a', '1');
        expect(p.get('a')).toBe('1');
        expect(p.getAll('a')).toEqual(['1']);
        expect(`${p}`).toBe('a=1');

        p.append('b', '2');
        expect(p.get('b')).toBe('2');
        expect(p.getAll('b')).toEqual(['2']);
        expect(`${p}`).toBe('a=1&b=2');

        p.append('a', '3');
        expect(p.get('a')).toBe('1');
        expect(p.getAll('a')).toEqual(['1', '3']);
        expect(`${p}`).toBe('a=1&b=2&a=3');

        p['delete']('a');
        expect(`${p}`).toBe('b=2');
        expect(p.getAll('a')).toEqual([]);

        p['delete']('b');
        expect(p.getAll('b')).toEqual([]);

        p = new URLSearchParams('m=9&n=3');
        expect(p.has('a')).toBe(false);
        expect(p.has('b')).toBe(false);
        expect(p.get('m')).toBe('9');
        expect(p.get('n')).toBe('3');

        p = new URLSearchParams();
        p.set('a', '1');
        expect(p.getAll('a')).toEqual(['1']);
        p = new URLSearchParams('a=1&b=1&b=2&c=1');
        p.set('b', '3');
        expect(p.getAll('b')).toEqual(['3']);
        expect(`${p}`).toBe('a=1&b=3&c=1');

        // Ensure copy constructor copies by value, not reference.
        const sp1 = new URLSearchParams('a=1');
        expect(`${sp1}`).toBe('a=1');
        const sp2 = new URLSearchParams(sp1);
        expect(`${sp2}`).toBe('a=1');
        sp1.append('b', '2');
        sp2.append('c', '3');
        expect(`${sp1}`).toBe('a=1&b=2');
        expect(`${sp2}`).toBe('a=1&c=3');
    });

    it('URLSearchParams sort', () => {
        const url = new URL('https://example.org/?q=🏳️‍🌈&key=e1f7bc78');
        url.searchParams.sort();
        expect(url.search).toEqual('?key=e1f7bc78&q=%F0%9F%8F%B3%EF%B8%8F%E2%80%8D%F0%9F%8C%88');

        const sp = new URLSearchParams();
        // noinspection JSCheckFunctionSignatures
        sp.append('a', 3);
        // noinspection JSCheckFunctionSignatures
        sp.append('b', 2);
        // noinspection JSCheckFunctionSignatures
        sp.append('a', 1);
        sp.sort();

        expect(`${sp}`).toEqual('a=3&a=1&b=2');
    });

    it('URLSearchParams serialization', () => {
        let p = new URLSearchParams();
        p.append('this\x00&that\x7f\xff', '1+2=3');
        expect(p.get('this\x00&that\x7f\xff')).toBe('1+2=3');
        expect(`${p}`).toBe('this%00%26that%7F%C3%BF=1%2B2%3D3');
        p = new URLSearchParams();
        p.append('a  b', 'a  b');
        expect(`${p}`).toBe('a++b=a++b');
        expect(p.get('a  b')).toBe('a  b');
    });

    it('URLSearchParams iterable methods - entries', () => {
        expect(Array.from(new URLSearchParams('a=1&b=2').entries())).toEqual([['a', '1'], ['b', '2']]);
    });

    it('URLSearchParams iterable methods - keys', () => {
        expect(Array.from(new URLSearchParams('a=1&b=2').keys())).toEqual(['a', 'b']);
    });

    it('URLSearchParams iterable methods - values', () => {
        expect(Array.from(new URLSearchParams('a=1&b=2').values())).toEqual(['1', '2']);
    });

    it('URLSearchParams iterable methods - Symbol.iterator', () => {
        if ('Symbol' in self && 'iterator' in self.Symbol) {
            expect(Array.from((new URLSearchParams('a=1&b=2'))[self.Symbol.iterator]()))
                .toEqual([['a', '1'], ['b', '2']]);
        }
    });

    it('URL contains native static methods', () => {
        expect(_.isFUN(URL.createObjectURL)).toBe(true);
        // Only implemented for Blob & File
        expect(URL.createObjectURL(new File(['foo'], 'doc.txt', {type : 'text/plain'}))).toMatch(({
            'ie' : ({9 : /^data:text\/plain;base64,Zm9v$/})[IEVersion],
        })[browserName] || /^blob:/);
        // Not implemented by the polyfill!
        expect(_.isFUN(URL.revokeObjectURL)).not.toBe(browserName === 'ie' && IEVersion === 9);
    });

    it('Regression tests', () => {
        // IE mangles the pathname when assigning to search with 'about:' URLs
        const p = new URL('about:blank').searchParams;
        // noinspection JSCheckFunctionSignatures
        p.append('a', 1);
        // noinspection JSCheckFunctionSignatures
        p.append('b', 2);
        expect(`${p}`).toBe('a=1&b=2');
    });

    it('URLSearchParams doesnt stringify with "Object"', () => {
        expect(`${(new URLSearchParams({key : '730d67'}))}`).toBe('key=730d67');
    });

    it('URLSearchParams constructed form a Record has working "get"', () => {
        expect(new URLSearchParams({key : 'alpha'}).get('key')).toBe('alpha');
        expect(new URLSearchParams({key : 'beta'}).get('key')).toBe('beta');
    });

    it('Construct file URL under MacOS', () => {
        expect(() => new URL('file://C:/test.png')).not.toThrowError();
    });

    it('Construct URL with empty base', () => {
        expect(new URL('', 'https://www.test.com?sid=1').searchParams.get('sid')).toBe('1');
    });

    describe('WPT tests', () => {
        it('appends same name correctly', () => {
            const params = new URLSearchParams();
            params.append('a', 'b');
            expect(`${params}`).toBe('a=b');
            params.append('a', 'b');
            expect(`${params}`).toBe('a=b&a=b');
            params.append('a', 'c');
            expect(`${params}`).toBe('a=b&a=b&a=c');
        });

        it('appends empty strings', () => {
            const params = new URLSearchParams();
            params.append('', '');
            expect(`${params}`).toBe('=');
            params.append('', '');
            expect(`${params}`).toBe('=&=');
        });

        it('appends null', () => {
            const params = new URLSearchParams();
            params.append(null, null);
            expect(`${params}`).toBe('null=null');
            params.append(null, null);
            expect(`${params}`).toBe('null=null&null=null');
        });

        it('appends multiple', () => {
            const params = new URLSearchParams();
            // noinspection JSCheckFunctionSignatures
            params.append('first', 1);
            // noinspection JSCheckFunctionSignatures
            params.append('second', 2);
            params.append('third', '');
            // noinspection JSCheckFunctionSignatures
            params.append('first', 10);
            expect(params.has('first')).toBe(true);
            expect(params.get('first')).toBe('1');
            expect(params.get('second')).toBe('2');
            expect(params.get('third')).toBe('');
            // noinspection JSCheckFunctionSignatures
            params.append('first', 10);
            expect(params.get('first')).toBe('1');
        });

        it('constructs', () => {
            let params = new URLSearchParams();
            expect(`${params}`).toBe('');
            params = new URLSearchParams('');
            expect(`${params}`).toBe('');
            params = new URLSearchParams('a=b');
            expect(`${params}`).toBe('a=b');
            params = new URLSearchParams(params);
            expect(`${params}`).toBe('a=b');
        });

        it('constructs without arguments', () => {
            expect(`${(new URLSearchParams())}`).toBe('');
        });

        it('removes leading ?', () => {
            expect(`${(new URLSearchParams('?a=b'))}`).toBe('a=b');
        });

        it('throws with DOMException as argument', () => {
            expect(`${(new URLSearchParams(DOMException))}`)
                // eslint-disable-next-line max-len
                .toBe('INDEX_SIZE_ERR=1&DOMSTRING_SIZE_ERR=2&HIERARCHY_REQUEST_ERR=3&WRONG_DOCUMENT_ERR=4&INVALID_CHARACTER_ERR=5&NO_DATA_ALLOWED_ERR=6&NO_MODIFICATION_ALLOWED_ERR=7&NOT_FOUND_ERR=8&NOT_SUPPORTED_ERR=9&INUSE_ATTRIBUTE_ERR=10&INVALID_STATE_ERR=11&SYNTAX_ERR=12&INVALID_MODIFICATION_ERR=13&NAMESPACE_ERR=14&INVALID_ACCESS_ERR=15&VALIDATION_ERR=16&TYPE_MISMATCH_ERR=17&SECURITY_ERR=18&NETWORK_ERR=19&ABORT_ERR=20&URL_MISMATCH_ERR=21&QUOTA_EXCEEDED_ERR=22&TIMEOUT_ERR=23&INVALID_NODE_TYPE_ERR=24&DATA_CLONE_ERR=25');
            expect(() => { new URLSearchParams(DOMException.prototype); })
                /**
                 * Chrome, Edge throws "TypeError: 'Illegal invocation'"
                 * Firefox,IE11 throws "TypeError: 'get name' called on an object
                 *                      that does not implement interface DOMException.'"
                 */
                .toThrowError(({
                    'chrome' : 'Illegal invocation',
                    'na'     : 'Illegal invocation', // Chrome Headless
                })[browserName]);
        });

        it('constructs from an empty string', () => {
            const params = new URLSearchParams('');
            expect(params).not.toBeNull();
            expect(Object.getPrototypeOf(params))
                .toBe(URLSearchParams.prototype);
        });

        it('constructs from {}', () => {
            expect(`${new URLSearchParams({})}`).toBe('');
        });

        it('constructs from an various weird strings', () => {
            let params = new URLSearchParams('a=b');
            expect(params).not.toBeNull();
            expect(params.has('a')).toBe(true);
            expect(params.has('b')).toBe(false);

            params = new URLSearchParams('a=b&c');
            expect(params).not.toBeNull();
            expect(params.has('a')).toBe(true);
            expect(params.has('c')).toBe(true);

            params = new URLSearchParams('&a&&& &&&&&a+b=& c&m%c3%b8%c3%b8');
            expect(params).not.toBeNull();
            expect(params.has('a')).toBe(true);
            expect(params.has('a b')).toBe(true);
            expect(params.has(' ')).toBe(true);
            expect(params.has('c')).toBe(false);
            expect(params.has(' c')).toBe(true);
            expect(params.has('møø')).toBe(true);

            params = new URLSearchParams('id=0&value=%');
            expect(params).not.toBeNull();
            expect(params.has('id')).toBe(true);
            expect(params.has('value')).toBe(true);
            expect(params.get('id')).toBe('0');
            expect(params.get('value')).toBe('%');

            params = new URLSearchParams('b=%2sf%2a');
            expect(params).not.toBeNull();
            expect(params.has('b')).toBe(true);
            expect(params.get('b')).toBe('%2sf*');

            params = new URLSearchParams('b=%2%2af%2a');
            expect(params).not.toBeNull();
            expect(params.has('b')).toBe(true);
            expect(params.get('b')).toBe('%2*f*');

            params = new URLSearchParams('b=%%2a');
            expect(params).not.toBeNull();
            expect(params.has('b')).toBe(true);
            expect(params.get('b')).toBe('%*');
        });

        it('constructs from URLSearchParams / FormData', () => {
            validate(new URLSearchParams('a=b&c=d'));
            if (window.FormData) {
                const formData = new FormData();
                formData.append('a', 'b');
                formData.append('c', 'd');
                validate(formData);
            }

            function validate(data) {
                const params = new URLSearchParams(data);
                expect(params).not.toBeNull();
                expect(params.get('a')).toBe('b');
                expect(params.get('c')).toBe('d');
                expect(params.has('d')).toBe(false);
                // The name-value pairs are copied when created; later updates
                // should not be observable.
                data.append('e', 'f');
                expect(params.has('e')).toBe(false);
                params.append('g', 'h');
                expect(data.has('g')).toBe(false);
            }
        });

        it('parses +', () => {
            expect(new URLSearchParams('a=b+c').get('a')).toBe('b c');
            expect(new URLSearchParams('a+b=c').get('a b')).toBe('c');
        });

        it('parses encoded +', () => {
            const testValue = '+15555555555';
            const params = new URLSearchParams();
            params.set('query', testValue);
            expect(`${params}`).toBe('query=%2B15555555555');
            expect(params.get('query')).toBe(testValue);
            expect(new URLSearchParams(`${params}`).get('query')).toBe(testValue);
        });

        it('parses space', () => {
            expect(new URLSearchParams('a=b c').get('a')).toBe('b c');
            expect(new URLSearchParams('a b=c').get('a b')).toBe('c');
        });

        it('parses %20', () => {
            expect(new URLSearchParams('a=b%20c').get('a')).toBe('b c');
            expect(new URLSearchParams('a%20b=c').get('a b')).toBe('c');
        });

        it('parses \\0', () => {
            expect(new URLSearchParams('a=b\0c').get('a')).toBe('b\0c');
            expect(new URLSearchParams('a\0b=c').get('a\0b')).toBe('c');
        });

        it('parses %00', () => {
            expect(new URLSearchParams('a=b%00c').get('a')).toBe('b\0c');
            expect(new URLSearchParams('a%00b=c').get('a\0b')).toBe('c');
        });

        it('parses \u2384', () => {
            expect(new URLSearchParams('a=b\u2384').get('a')).toBe('b\u2384');
            expect(new URLSearchParams('a\u2384b=c').get('a\u2384b')).toBe('c');
        });  // Unicode Character 'COMPOSITION SYMBOL' (U+2384)

        it('parses %e2%8e%84', () => {
            expect(new URLSearchParams('a=b%e2%8e%84').get('a')).toBe('b\u2384');
            expect(new URLSearchParams('a%e2%8e%84b=c').get('a\u2384b')).toBe('c');
        });  // Unicode Character 'COMPOSITION SYMBOL' (U+2384)

        it('parses \uD83D\uDCA9', () => {
            expect(new URLSearchParams('a=b\uD83D\uDCA9c').get('a')).toBe('b\uD83D\uDCA9c');
            expect(new URLSearchParams('a\uD83D\uDCA9b=c').get('a\uD83D\uDCA9b')).toBe('c');
        });  // Unicode Character 'PILE OF POO' (U+1F4A9)

        it('parses %f0%9f%92%a9', () => {
            expect(new URLSearchParams('a=b%f0%9f%92%a9c').get('a')).toBe('b\uD83D\uDCA9c');
            expect(new URLSearchParams('a%f0%9f%92%a9b=c').get('a\uD83D\uDCA9b')).toBe('c');
        });  // Unicode Character 'PILE OF POO' (U+1F4A9)

        it('constructs with sequence of sequences of strings', () => {
            let params = new URLSearchParams([]);
            expect(params).not.toBeNull();
            params = new URLSearchParams([['a', 'b'], ['c', 'd']]);
            expect(params.get('a')).toBe('b');
            expect(params.get('c')).toBe('d');

            expect(() => { new URLSearchParams([[1]]); }).toThrowError(({
                // eslint-disable-next-line max-len
                'chrome' : 'Failed to construct \'URLSearchParams\': Failed to construct \'URLSearchParams\': Sequence initializer must only contain pair elements',
                // eslint-disable-next-line max-len
                'na'     : 'Failed to construct \'URLSearchParams\': Failed to construct \'URLSearchParams\': Sequence initializer must only contain pair elements', // Chrome Headless
            })[browserName]);

            expect(() => { new URLSearchParams([[1, 2, 3]]); }).toThrowError(({
                // eslint-disable-next-line max-len
                'chrome' : 'Failed to construct \'URLSearchParams\': Failed to construct \'URLSearchParams\': Sequence initializer must only contain pair elements',
                // eslint-disable-next-line max-len
                'na'     : 'Failed to construct \'URLSearchParams\': Failed to construct \'URLSearchParams\': Sequence initializer must only contain pair elements', // Chrome Headless
            })[browserName]);
        });

        [
            {
                input  : 'z=b&a=b&z=a&a=a',
                output : [['a', 'b'], ['a', 'a'], ['z', 'b'], ['z', 'a']],
            },
            {
                input  : '\uFFFD=x&\uFFFC&\uFFFD=a',
                output : [['\uFFFC', ''], ['\uFFFD', 'x'], ['\uFFFD', 'a']],
            },
            {
                input  : 'ﬃ&🌈', // 🌈 > code point, but < code unit because two code units
                output : [['🌈', ''], ['ﬃ', '']],
            },
            // Fails in Safari 9.1
            // {
            //  input: "é&e\uFFFD&e\u0301",
            //  output: [["e\u0301", ""], ["e\uFFFD", ""], ["é", ""]]
            // },
            {
                input : 'z=z&a=a&z=y&a=b&z=x&a=c&z=w&a=d&z=v&a=e&z=u&a=f&z=t&a=g',
                // eslint-disable-next-line max-len
                output : [['a', 'a'], ['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'], ['a', 'f'], ['a', 'g'], ['z', 'z'], ['z', 'y'], ['z', 'x'], ['z', 'w'], ['z', 'v'], ['z', 'u'], ['z', 't']],
            },
            {
                input  : 'bbb&bb&aaa&aa=x&aa=y',
                output : [['aa', 'x'], ['aa', 'y'], ['aaa', ''], ['bb', ''], ['bbb', '']],
            },
            {
                input  : 'z=z&=f&=t&=x',
                output : [['', 'f'], ['', 't'], ['', 'x'], ['z', 'z']],
            },
            {
                input  : 'a🌈&a💩',
                output : [['a🌈', ''], ['a💩', '']],
            },
        ].forEach(val => {
            it(`parses and sorts: ${val.input}`, () => {
                const params = new URLSearchParams(val.input);
                params.sort();
                expect(val.output).toEqual(Array.from(params.entries()));
            });

            it('parses a URL and sorts: ' + val.input, () => {
                const url = new URL('?' + val.input, 'https://example/');
                url.searchParams.sort();
                const params = new URLSearchParams(url.search);
                params.sort();
                expect(val.output).toEqual(Array.from(params.entries()));
            });
        });

        it('removes ? from URL after sorting', () => {
            const url = new URL('https://example.com/?');
            expect(url.href).toBe('https://example.com/?');
            url.searchParams.sort();
            expect(url.href).toBe('https://example.com/');
            expect(url.search).toBe('');
        });
    });
});
