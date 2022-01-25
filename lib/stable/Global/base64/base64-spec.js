const {atob, btoa} = require('./index');
// detector IE version is not the emulated version
const {name : browserName} = require('detector').browser, IEVersion = document.documentMode;

describe('base64', () => {
    it('No need to polyfill / patch', () => {
        expect(/* native */ /return win\.atob\(s\);/.test(`${atob}`)).toBe(
            browserName === 'chrome'
            || browserName === 'na' // Chrome Headless
            || browserName === 'firefox'
        );
    });

    it('atob - strips whitespaces', () => {
        expect(atob(' ')).toBe('');
    });

    it('atob - patches', () => {
        expect(atob('dGVzdA==')).toBe('test');

        expect(() => atob('测试')).toThrowMatching(thrown => `${thrown}` === ({
            // eslint-disable-next-line max-len
            'chrome'  : 'InvalidCharacterError: Failed to execute \'atob\' on \'Window\': The string to be decoded contains characters outside of the Latin1 range.',
            'firefox' : 'InvalidCharacterError: String contains an invalid character',
            // eslint-disable-next-line max-len
            'na'      : 'InvalidCharacterError: Failed to execute \'atob\' on \'Window\': The string to be decoded contains characters outside of the Latin1 range.', // Chrome Headless
            'ie'      : ({
                11 : 'InvalidCharacterError',
                10 : 'InvalidCharacterError',
                // eslint-disable-next-line max-len
                9  : 'TypeError: Failed to execute \'atob\' on \'Window\': The string to be decoded contains characters outside of the Latin1 range.',
            })[IEVersion],
            'edge'    : 'InvalidCharacterError',
        })[browserName]);

        expect(() => atob('1')).toThrowMatching(thrown => `${thrown}` === ({
            // eslint-disable-next-line max-len
            'chrome'  : 'InvalidCharacterError: Failed to execute \'atob\' on \'Window\': The string to be decoded is not correctly encoded.',
            'firefox' : 'InvalidCharacterError: String contains an invalid character',
            // eslint-disable-next-line max-len
            'na'      : 'InvalidCharacterError: Failed to execute \'atob\' on \'Window\': The string to be decoded is not correctly encoded.', // Chrome Headless
            'ie'      : ({
                11 : 'InvalidCharacterError',
                10 : 'InvalidCharacterError',
                // eslint-disable-next-line max-len
                9  : 'TypeError: Failed to execute \'atob\' on \'Window\': The string to be decoded is not correctly encoded.',
            })[IEVersion],
            'edge'    : 'InvalidCharacterError',
        })[browserName]);
    });

    it('btoa - patches', () => {
        expect(btoa('test')).toBe('dGVzdA==');
        expect(() => btoa('测试')).toThrowMatching(thrown => `${thrown}` === ({
            // eslint-disable-next-line max-len
            'chrome'  : 'InvalidCharacterError: Failed to execute \'btoa\' on \'Window\': The string to be encoded contains characters outside of the Latin1 range.',
            'firefox' : 'InvalidCharacterError: String contains an invalid character',
            // eslint-disable-next-line max-len
            'na'      : 'InvalidCharacterError: Failed to execute \'btoa\' on \'Window\': The string to be encoded contains characters outside of the Latin1 range.', // Chrome Headless
            'ie'      : ({
                11 : 'InvalidCharacterError',
                10 : 'InvalidCharacterError',
                // eslint-disable-next-line max-len
                9  : 'TypeError: Failed to execute \'btoa\' on \'Window\': The string to be encoded contains characters outside of the Latin1 range.',
            })[IEVersion],
            'edge'    : 'InvalidCharacterError',
        })[browserName]);
    });
});
