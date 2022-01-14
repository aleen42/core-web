describe('File', () => {
    let File, Blob;
    beforeEach(async () => {
        !Blob && (Blob = (await require('../Blob')).Blob);
        !File && (File = (await require('./index')).File);
    });

    it('prototype', () => {
        expect(Object.getPrototypeOf(File.prototype)).toBe(Blob.prototype);
        expect(`${File.prototype}`).toBe('[object File]');
    });
});
