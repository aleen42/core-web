// detector IE version is not the emulated version
const {name : browserName} = require('detector').browser;

describe('XMLHttpRequest', () => {
    let XMLHttpRequest, Blob;
    beforeEach(async () => {
        !Blob && (Blob = (await require('../Blob')).Blob);
        !XMLHttpRequest && (XMLHttpRequest = (await require('./index')).XMLHttpRequest);
    });

    it('Need to patch', () => {
        expect(expect(/\[native code]/.test(`${XMLHttpRequest.prototype.send}`))).not.toBe(
            browserName === 'ie'
        );
    });
});
