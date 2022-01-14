// detector IE version is not the emulated version
const {name : browserName} = require('detector').browser;

describe('FileReader', () => {
    let FileReader, Blob;
    beforeEach(async () => {
        !Blob && (Blob = (await require('../Blob')).Blob);
        !FileReader && (FileReader = (await require('./index')).FileReader);
    });

    it('constructor', () => {
        expect(() => { FileReader(); }).toThrowMatching(thrown => `${thrown}` === ({
            // eslint-disable-next-line max-len
            'firefox' : 'TypeError: FileReader constructor: \'new\' is required',
            // eslint-disable-next-line max-len
        })[browserName] || 'TypeError: Failed to construct \'FileReader\': Please use the \'new\' operator, this DOM object constructor cannot be called as a function.');
    });

    it('Blob\'s prototype', () => {
        expect(_.isFUN(Blob.prototype.arrayBuffer)).toBeTrue();
        expect(_.isFUN(Blob.prototype.text)).toBeTrue();
    });
});
