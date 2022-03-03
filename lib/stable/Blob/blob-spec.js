// REF: https://github.com/Financial-Times/polyfill-library/blob/master/polyfills/Blob/tests.js

const {browser : {name : browserName}} = require('detector'), IEVersion = document.documentMode;

describe('Blob', () => {
    let URL, Blob, fetch;
    beforeEach(async () => {
        !URL && (URL = (await require('../URL')).URL);
        !Blob && (Blob = (await require('./index')).Blob);
        !fetch && (fetch = (await require('../../featured/Fetch')).fetch);
    });

    it('Need to polyfill / patch', () => {
        expect(window.Blob !== Blob).toBe(
            // polyfill + patch
            (browserName === 'edge') // Old Edge
            || (browserName === 'ie' && IEVersion === 11)
            || (browserName === 'ie' && IEVersion === 10)
            // polyfill
            || (browserName === 'ie' && IEVersion === 9)
        );
    });

    it('Blob should be a function', () => {
        expect(_.isFUN(Blob)).toBeTrue();
    });

    it('Blob should have a length of 0', () => {
        expect(Blob.length).toBe(0);
    });

    it('throws an error if called without `new` operator', () => {
        expect(() => { Blob(); }).toThrowError();
    });

    it('throws an error if called with null / boolean / number / string', () => {
        expect(() => { new Blob(null); }).toThrowError();

        expect(() => { new Blob(true); }).toThrowError();
        expect(() => { new Blob(false); }).toThrowError();

        expect(() => { new Blob(0); }).toThrowError();
        expect(() => { new Blob(1); }).toThrowError();
        expect(() => { new Blob(1.5); }).toThrowError();

        expect(() => { new Blob('fail'); }).toThrowError();
    });

    it('throws an error if called with a date / RegExp / object / HTMLElement / Window', () => {
        expect(() => { new Blob(new Date()); }).toThrowError();

        expect(() => { new Blob(new RegExp()); }).toThrowError();

        expect(() => { new Blob({}); }).toThrowError();
        expect(() => { new Blob({0 : 'fail', length : 1}); }).toThrowError();

        expect(() => { new Blob(document.createElement('div')); }).toThrowError();

        expect(() => { new Blob(window); }).toThrowError();
    });

    it('can construct a Blob when given `undefined`', () => {
        const blob = new Blob();
        expect(blob.size).toBe(0);
        expect(blob.type).toBe('');
    });

    it('can construct a Blob when called with an empty Array', () => {
        const blob = new Blob([]);
        expect(blob.size).toBe(0);
        expect(blob.type).toBe('');
    });

    it('can construct a Blob when called with an Array', () => {
        const blob = new Blob([null, true, false, 0, 1, 1.5, 'fail', {}]);
        expect(blob.size).toBe(37);
        expect(blob.type).toBe('');
    });

    it('should be able to construct a Blob object when called with an array of Blob objects', () => {
        const blob = new Blob([new Blob(['1']), new Blob(['2'])]);
        expect(blob.size).toBe(2);
        expect(blob.type).toBe('');
    });

    it('should throw if second argument is a number / boolean / string', () => {
        expect(() => { new Blob([], 12345); }).toThrowError();
        expect(() => { new Blob([], 1.2); }).toThrowError();

        expect(() => { new Blob([], true); }).toThrowError();
        expect(() => { new Blob([], false); }).toThrowError();

        expect(() => { new Blob([], 'fail'); }).toThrowError();
    });

    it('should use the type property of the second argument as the type property on the returned Blob object', () => {
        const blob = new Blob([], {type : 'test'});
        expect(blob.size).toBe(0);
        expect(blob.type).toBe('test');
    });

    it('returns new full blob is slice is called with no arguments', () => {
        const blob1 = new Blob(['test']);
        const blob2 = blob1.slice();
        expect(blob1).not.toBe(blob2);
        expect(blob2.size).toBe(4);
        expect(blob2.type).toBe('');
    });

    it('uses first argument of slice to decide where to start the slice', () => {
        const blob1 = new Blob(['test']);
        const blob2 = blob1.slice(1);
        expect(blob2.size).toBe(3);
    });

    it('if first argument of slice is greater than blob size, return an empty blob', () => {
        const blob1 = new Blob(['test']);
        const blob2 = blob1.slice(5);
        expect(blob2.size).toBe(0);
    });

    it('uses second argument of slice to decide where to end the slice', () => {
        const blob1 = new Blob(['test']);
        const blob2 = blob1.slice(0, 1);
        expect(blob2.size).toBe(1);
    });

    it('if second argument of slice is less than first argument, return an empty blob', () => {
        const blob1 = new Blob(['test']);
        const blob2 = blob1.slice(2, 1);
        expect(blob2.size).toBe(0);
    });

    it('uses third argument of slice to decide as the type of the new blob', () => {
        const blob1 = new Blob(['test']);
        const blob2 = blob1.slice(0, 1, 'a');
        expect(blob2.size).toBe(1);
        expect(blob1.type).toBe('');
        expect(blob2.type).toBe('a');
    });

    it('can be converted to an object url', () => {
        const blobURL = URL.createObjectURL(new Blob(['test']));
        expect(/^(?:data|blob):/.test(blobURL)).toBeTrue();
    });

    it('object url has "null" origin', () => {
        const blobURL = URL.createObjectURL(new Blob(['test']));
        expect(blobURL.origin == null).toBeTrue();
    });

    it('object url can be fetched', () => {
        return fetch(URL.createObjectURL(new Blob(['test']))).then(resp => {
            if (resp.status !== 200) throw new Error(`unexpected status code ${resp.status}`);
            return resp.text();
        }).then(text => {
            expect(text).toBe('test');
        }).catch(() => {
            // TODO: IE9- throws "Access is denied" when fetching blob URL
            expect(browserName).toBe('ie');
            expect(IEVersion).toBeLessThan(10);
        });
    });
});
